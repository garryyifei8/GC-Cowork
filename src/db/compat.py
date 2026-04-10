"""Compatibility helpers for Supabase ↔ Pydantic model interop.

Use `val()` instead of `.value` when extracting enum string values,
so code works with both Pydantic Enum objects and plain Supabase strings.
"""


def val(obj) -> str:
    """Extract string value from an Enum or plain string.

    Works with:
      - Python Enum: val(TaskStatus.DONE) → "done"
      - Plain str:   val("done") → "done"
      - EnumStr:     val(EnumStr("done")) → "done"
      - None:        val(None) → ""
    """
    if obj is None:
        return ""
    if hasattr(obj, "value"):
        return str(obj.value)
    return str(obj)
