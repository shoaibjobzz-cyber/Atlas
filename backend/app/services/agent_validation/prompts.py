from textwrap import dedent

from app.schemas.agent_validation import DeepReviewAgentResult, RewriteAgentResult, TriageAgentResult
from app.services.agent_validation.models import DuplicateCandidate, RetrievedChunk


def _format_chunks(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "No retrieved document evidence was available."
    return "\n\n".join(
        [
            f"[{chunk.document_id}/{chunk.chunk_id} | score={chunk.score:.3f}]\n{chunk.text}"
            for chunk in chunks
        ]
    )


def _format_duplicates(duplicates: list[DuplicateCandidate]) -> str:
    if not duplicates:
        return "No likely duplicates found."
    return "\n".join(
        [
            f"- {item.requirement_id} ({item.score:.2f}): {item.title} :: {item.text}"
            for item in duplicates
        ]
    )


def triage_instructions() -> str:
    return dedent(
        f"""
        You are the triage agent for a requirements engineering application.
        Use a fast, low-cost review. Focus on:
        - completeness
        - template compliance
        - obvious ambiguity
        - duplication risk
        - whether deeper review is needed

        Return structured JSON matching the {TriageAgentResult.__name__} schema exactly.
        Escalate when contradiction risk, non-trivial ambiguity, or missing evidence suggests
        the requirement needs deeper analysis.
        """
    ).strip()


def deep_review_instructions() -> str:
    return dedent(
        f"""
        You are the deep-review agent for a requirements engineering application.
        Review the requirement against retrieved evidence only.
        Focus on:
        - ambiguity
        - contradictions against evidence
        - missing assumptions
        - missing interfaces
        - weak wording
        - traceability suggestions
        - proposed corrected wording
        - acceptance criteria derivation

        Return structured JSON matching the {DeepReviewAgentResult.__name__} schema exactly.
        Do not invent evidence that is not present in the provided retrieved chunks.
        """
    ).strip()


def rewrite_instructions() -> str:
    return dedent(
        f"""
        You are a rewrite assistant for requirements engineering.
        Produce concise, measurable rewrite candidates.
        Return structured JSON matching the {RewriteAgentResult.__name__} schema exactly.
        """
    ).strip()


def build_triage_prompt(
    *,
    requirement_title: str,
    requirement_text: str,
    requirement_type: str,
    retrieved_chunks: list[RetrievedChunk],
    duplicate_candidates: list[DuplicateCandidate],
) -> str:
    return dedent(
        f"""
        Requirement title: {requirement_title}
        Requirement type: {requirement_type}
        Requirement text:
        {requirement_text}

        Retrieved evidence:
        {_format_chunks(retrieved_chunks)}

        Duplicate candidates:
        {_format_duplicates(duplicate_candidates)}
        """
    ).strip()


def build_deep_review_prompt(
    *,
    requirement_title: str,
    requirement_text: str,
    requirement_type: str,
    triage_summary: TriageAgentResult,
    retrieved_chunks: list[RetrievedChunk],
) -> str:
    return dedent(
        f"""
        Requirement title: {requirement_title}
        Requirement type: {requirement_type}
        Requirement text:
        {requirement_text}

        Triage result:
        {triage_summary.model_dump_json(indent=2)}

        Retrieved evidence:
        {_format_chunks(retrieved_chunks)}
        """
    ).strip()


def build_rewrite_prompt(
    *,
    requirement_title: str,
    requirement_text: str,
    requirement_type: str,
    retrieved_chunks: list[RetrievedChunk],
) -> str:
    return dedent(
        f"""
        Requirement title: {requirement_title}
        Requirement type: {requirement_type}
        Requirement text:
        {requirement_text}

        Retrieved evidence:
        {_format_chunks(retrieved_chunks)}

        Produce 2-3 improved requirement rewrites with rationale.
        """
    ).strip()
