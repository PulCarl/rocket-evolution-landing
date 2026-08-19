import { Fragment } from "react";
import { marqueeItems } from "../data/content.js";
import styles from "./Marquee.module.css";

function MarqueeGroup() {
  return (
    <div className={styles.group}>
      {marqueeItems.map((item) => (
        <Fragment key={item}>
          <span>{item}</span>
          <span>·</span>
        </Fragment>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        <MarqueeGroup />
        <MarqueeGroup />
        <MarqueeGroup />
        <MarqueeGroup />
      </div>
    </div>
  );
}
