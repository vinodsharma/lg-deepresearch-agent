# src/api/agui_agent.py
"""Custom LangGraph AG-UI agent with tool name fix."""

import json
import uuid
from typing import Any, AsyncGenerator, Dict, Optional, Union

from ag_ui.core import (
    EventType,
    RunAgentInput,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    ToolCallStartEvent,
)
from ag_ui_langgraph.types import MessageInProgress
from copilotkit import LangGraphAGUIAgent
from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import Command

# Event type constant for OnToolEnd
ON_TOOL_END = "on_tool_end"


def _json_safe(obj: Any) -> str:
    """Safely convert object to JSON string."""
    try:
        return json.dumps(obj)
    except (TypeError, ValueError):
        return str(obj)


class FixedLangGraphAGUIAgent(LangGraphAGUIAgent):
    """LangGraphAGUIAgent with fix for tool_call_name being None.

    This subclass fixes a compatibility issue between ag_ui_langgraph and
    deepagents/LangGraph where ToolMessage.name is None when processing
    OnToolEnd events. The fix uses event["name"] as a fallback.
    """

    def __init__(
        self,
        *,
        name: str,
        graph: CompiledStateGraph,
        description: Optional[str] = None,
        config: Union[Optional[RunnableConfig], dict] = None,
    ):
        super().__init__(name=name, graph=graph, description=description, config=config)

    async def run(self, input: RunAgentInput) -> AsyncGenerator[str, None]:
        """Override to ensure terminal event is always emitted.

        The parent class may fail to emit RUN_FINISHED or RUN_ERROR if an
        exception is raised during stream processing (e.g., GraphRecursionError).
        This override wraps the parent's implementation in try/except to ensure
        a terminal event is always yielded.
        """
        import logging

        thread_id = input.thread_id or str(uuid.uuid4())
        run_id = input.run_id

        has_emitted_run_started = False
        has_emitted_terminal = False

        try:
            async for event in super().run(input):
                # Track events by checking the event object's type attribute
                # Events are AG-UI event objects (not strings) at this point
                if hasattr(event, "type"):
                    event_type = event.type
                    if event_type == EventType.RUN_STARTED:
                        has_emitted_run_started = True
                    elif event_type in (EventType.RUN_FINISHED, EventType.RUN_ERROR):
                        has_emitted_terminal = True
                yield event

            # After generator exhausts normally, emit terminal if missing
            if not has_emitted_terminal:
                logging.info("AG-UI run completed without terminal event, emitting RUN_FINISHED")
                yield self._dispatch_event(
                    RunFinishedEvent(
                        type=EventType.RUN_FINISHED,
                        thread_id=thread_id,
                        run_id=run_id or str(uuid.uuid4()),
                    )
                )

        except Exception as e:
            # Log the error
            logging.error(f"Error in AG-UI agent run: {e}")

            # Emit RUN_STARTED if not already emitted
            if not has_emitted_run_started:
                yield self._dispatch_event(
                    RunStartedEvent(
                        type=EventType.RUN_STARTED,
                        thread_id=thread_id,
                        run_id=run_id or str(uuid.uuid4()),
                    )
                )

            # Always emit RUN_ERROR for exceptions
            yield self._dispatch_event(
                RunErrorEvent(
                    type=EventType.RUN_ERROR,
                    message=str(e),
                    code="AGENT_ERROR",
                )
            )

    def set_message_in_progress(self, run_id: str, data: MessageInProgress) -> None:
        """Override to fix bug when messages_in_process[run_id] is None.

        The base class uses .get(run_id, {}) which returns None if the key
        exists with value None, causing **None to fail. This fix uses 'or {}'.
        """
        current = self.messages_in_process.get(run_id) or {}
        self.messages_in_process[run_id] = {
            **current,
            **data,
        }

    async def _handle_single_event(
        self, event: Any, state: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Override to fix tool_call_name being None in OnToolEnd events.

        When processing OnToolEnd events with Command outputs containing
        ToolMessages, the ToolMessage.name field may be None. This override
        uses event["name"] (the tool/node name) as a fallback.
        """
        event_type = event.get("event")

        # Handle OnToolEnd events with our fix
        if event_type == ON_TOOL_END:
            tool_call_output = event.get("data", {}).get("output")

            # Get the tool name from the event as fallback
            tool_name_fallback = event.get("name", "unknown_tool")

            if isinstance(tool_call_output, Command):
                # Extract ToolMessages from Command.update
                update_dict = tool_call_output.update or {}
                messages = update_dict.get("messages", []) if isinstance(update_dict, dict) else []
                tool_messages = [m for m in messages if isinstance(m, ToolMessage)]

                # Process each tool message with fixed name
                for tool_msg in tool_messages:
                    # Use tool_msg.name if available, otherwise fall back to event name
                    tool_name = tool_msg.name if tool_msg.name else tool_name_fallback

                    if not self.active_run.get("has_function_streaming"):
                        yield self._dispatch_event(
                            ToolCallStartEvent(
                                type=EventType.TOOL_CALL_START,
                                tool_call_id=tool_msg.tool_call_id,
                                tool_call_name=tool_name,
                                parent_message_id=tool_msg.id,
                                raw_event=event,
                            )
                        )
                        yield self._dispatch_event(
                            ToolCallArgsEvent(
                                type=EventType.TOOL_CALL_ARGS,
                                tool_call_id=tool_msg.tool_call_id,
                                delta=_json_safe(event.get("data", {}).get("input", {})),
                                raw_event=event,
                            )
                        )
                        yield self._dispatch_event(
                            ToolCallEndEvent(
                                type=EventType.TOOL_CALL_END,
                                tool_call_id=tool_msg.tool_call_id,
                                raw_event=event,
                            )
                        )

                    content = (
                        tool_msg.content
                        if isinstance(tool_msg.content, str)
                        else _json_safe(tool_msg.content)
                    )
                    yield self._dispatch_event(
                        ToolCallResultEvent(
                            type=EventType.TOOL_CALL_RESULT,
                            tool_call_id=tool_msg.tool_call_id,
                            message_id=str(uuid.uuid4()),
                            content=content,
                            role="tool",
                        )
                    )
                return

            # Handle non-Command tool outputs with fixed name
            if tool_call_output is not None and hasattr(tool_call_output, "tool_call_id"):
                tool_name = getattr(tool_call_output, "name", None) or tool_name_fallback

                if not self.active_run.get("has_function_streaming"):
                    yield self._dispatch_event(
                        ToolCallStartEvent(
                            type=EventType.TOOL_CALL_START,
                            tool_call_id=tool_call_output.tool_call_id,
                            tool_call_name=tool_name,
                            parent_message_id=getattr(tool_call_output, "id", str(uuid.uuid4())),
                            raw_event=event,
                        )
                    )
                    yield self._dispatch_event(
                        ToolCallArgsEvent(
                            type=EventType.TOOL_CALL_ARGS,
                            tool_call_id=tool_call_output.tool_call_id,
                            delta=_json_safe(event.get("data", {}).get("input", {})),
                            raw_event=event,
                        )
                    )
                    yield self._dispatch_event(
                        ToolCallEndEvent(
                            type=EventType.TOOL_CALL_END,
                            tool_call_id=tool_call_output.tool_call_id,
                            raw_event=event,
                        )
                    )

                content = getattr(tool_call_output, "content", tool_call_output)
                yield self._dispatch_event(
                    ToolCallResultEvent(
                        type=EventType.TOOL_CALL_RESULT,
                        tool_call_id=tool_call_output.tool_call_id,
                        message_id=str(uuid.uuid4()),
                        content=content if isinstance(content, str) else _json_safe(content),
                        role="tool",
                    )
                )
                return

        # For all other events, delegate to parent
        async for event_str in super()._handle_single_event(event, state):
            yield event_str
