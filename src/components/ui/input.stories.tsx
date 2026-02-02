import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
    title: "UI/Input",
    component: Input,
    tags: ["autodocs"],
    argTypes: {
        type: {
            control: "select",
            options: ["text", "password", "email", "number", "date", "file"],
        },
        disabled: {
            control: "boolean",
        },
    },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
    args: {
        placeholder: "Digite seu nome...",
        type: "text",
    },
};

export const Disabled: Story = {
    args: {
        placeholder: "Não pode digitar aqui",
        disabled: true,
    },
};

export const Password: Story = {
    args: {
        placeholder: "Sua senha secreta",
        type: "password",
    },
};

export const File: Story = {
    args: {
        type: "file",
    },
};