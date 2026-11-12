import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./PrimaryButton.module.css";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function PrimaryButton({ children, className, ...props }: PrimaryButtonProps) {
  const classes = [styles.button, className].filter(Boolean).join(" ");
  return <button className={classes} {...props}>{children}</button>;
}
