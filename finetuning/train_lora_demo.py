"""LoRA fine-tuning proof script.

This is intentionally a scaffold: it shows the workflow LMH would expect without forcing a GPU-heavy run during CI.
To run for real, install requirements-ai-optional.txt and provide a suitable base model.
"""
from __future__ import annotations
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--data", default="finetuning/sample_health_instruction_tuning.jsonl")
    parser.add_argument("--output", default="runtime/lora-health-assistant-demo")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.dry_run:
        print({"status":"dry_run_ok","model":args.model,"data":args.data,"output":args.output})
        return
    try:
        from datasets import load_dataset  # type: ignore
        from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments  # type: ignore
        from peft import LoraConfig  # type: ignore
        from trl import SFTTrainer  # type: ignore
    except ImportError as exc:
        raise SystemExit("Install optional AI requirements first: pip install -r requirements-ai-optional.txt") from exc

    dataset = load_dataset("json", data_files=args.data, split="train")
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForCausalLM.from_pretrained(args.model)
    peft_config = LoraConfig(r=8, lora_alpha=16, lora_dropout=0.05, target_modules="all-linear", task_type="CAUSAL_LM")
    training_args = TrainingArguments(output_dir=args.output, num_train_epochs=1, per_device_train_batch_size=1, logging_steps=1)
    trainer = SFTTrainer(model=model, tokenizer=tokenizer, train_dataset=dataset, peft_config=peft_config, args=training_args)
    trainer.train()
    trainer.save_model(args.output)

if __name__ == "__main__":
    main()
