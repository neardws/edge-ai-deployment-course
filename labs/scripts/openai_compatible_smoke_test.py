#!/usr/bin/env python3
import argparse
import json
import urllib.error
import urllib.request


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Smoke test a local OpenAI-compatible chat completions endpoint."
    )
    parser.add_argument("--base-url", default="http://localhost:8080/v1")
    parser.add_argument("--model", default="qwen-local")
    parser.add_argument("--prompt", default="用三句话解释端侧模型量化。")
    parser.add_argument("--timeout", type=float, default=60.0)
    args = parser.parse_args()

    payload = {
        "model": args.model,
        "messages": [{"role": "user", "content": args.prompt}],
        "temperature": 0.2,
        "max_tokens": 128,
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{args.base_url.rstrip('/')}/chat/completions",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=args.timeout) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(exc.read().decode("utf-8", errors="replace"))
        raise

    print(json.dumps(body, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
