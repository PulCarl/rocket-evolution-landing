import { useInView } from "../hooks/useInView.js";

export default function Reveal({ children, delay = 0, as: Tag = "div", className = "", style, ...props }) {
  const [ref, inView] = useInView();
  const cascadeDelay = Math.min(delay, 360);

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? "is-visible" : ""} ${className}`.trim()}
      style={{ ...style, transitionDelay: `${cascadeDelay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}
