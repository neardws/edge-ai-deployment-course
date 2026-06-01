#!/usr/bin/env bash
set -euo pipefail

section() {
  printf '\n## %s\n' "$1"
}

run_or_note() {
  local label="$1"
  shift
  section "$label"
  if command -v "$1" >/dev/null 2>&1; then
    "$@" || true
  else
    printf 'Command not found: %s\n' "$1"
  fi
}

section "System"
uname -a

run_or_note "CPU" lscpu
run_or_note "Memory" free -h
run_or_note "Disk" df -h
run_or_note "NVIDIA GPU" nvidia-smi
run_or_note "Python" python3 --version
run_or_note "CMake" cmake --version
run_or_note "Git" git --version
