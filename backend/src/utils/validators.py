import re
from ..models import Task


def check_answer(answer: str, task: Task) -> bool:
    if task.answer_regex:
        return re.fullmatch(task.answer_regex, answer or "") is not None
    if task.case_sensitive:
        return (answer or "") == (task.correct_answer or "")
    return (answer or "").strip().lower() == (task.correct_answer or "").strip().lower()
