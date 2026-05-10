def extract_text(*, file_name: str, content: str, content_type: str) -> str:
    """Normalize uploaded text content.

    This scaffold accepts text payloads directly so the extraction boundary stays
    easy to extend later for PDF or DOCX parsing.
    """
    normalized = content.replace("\x00", "").strip()
    if not normalized:
        raise ValueError(f"Document '{file_name}' did not contain any readable text.")

    if content_type.startswith("text/") or content_type in {"application/json", "application/xml"}:
        return normalized

    return normalized
