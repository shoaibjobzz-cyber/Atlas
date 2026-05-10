import re


def chunk_text(text: str, *, chunk_size: int, chunk_overlap: int) -> list[str]:
    normalized = re.sub(r"\r\n?", "\n", text).strip()
    if not normalized:
        return []

    paragraphs = [paragraph.strip() for paragraph in normalized.split("\n\n") if paragraph.strip()]
    chunks: list[str] = []
    buffer = ""

    for paragraph in paragraphs:
        if len(paragraph) <= chunk_size and len(buffer) + len(paragraph) + 2 <= chunk_size:
            buffer = f"{buffer}\n\n{paragraph}".strip()
            continue

        if buffer:
            chunks.append(buffer)
            buffer = ""

        if len(paragraph) <= chunk_size:
            buffer = paragraph
            continue

        start = 0
        step = max(1, chunk_size - chunk_overlap)
        while start < len(paragraph):
            chunks.append(paragraph[start : start + chunk_size])
            start += step

    if buffer:
        chunks.append(buffer)

    return chunks
