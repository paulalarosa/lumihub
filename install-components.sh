#!/bin/bash
# Install all required shadcn/ui components for the project

# Components needed for Project Dashboard & Contract System
COMPONENTS=(
  "tabs"
  "dialog"
  "badge"
  "avatar"
  "scroll-area"
  "card"
  "button"
  "input"
  "label"
  "select"
  "checkbox"
)

echo "Installing shadcn/ui components..."
npx shadcn-ui@latest add tabs dialog badge avatar scroll-area card button input label select checkbox

echo "All components installed successfully!"
