# Offline AI Safety and Supervisor Review Protocol Notes

Source: Demonstration AI safety operations packet.

When the assistant identifies emergency urgency, missing protocol evidence, prompt-injection attempts, PII redaction, or low-confidence response, route the case to supervisor review.

The assistant must not replace clinical judgment. It should cite protocol evidence, ask missing questions, avoid unsupported diagnosis, and escalate uncertainty.

Offline mode should queue feedback and review events locally, then sync when connectivity returns. Patient names, phone numbers, and ID numbers should not be stored in plain text.
