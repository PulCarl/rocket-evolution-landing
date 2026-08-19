import Reveal from "./Reveal.jsx";
import latestVideos from "../data/videos.json";
import styles from "./Videos.module.css";

export default function Videos() {
  return (
    <section data-bg="dark" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <Reveal as="h2" className={styles.title}>
            Les dernières vidéos
          </Reveal>
          <Reveal as="a" href="https://www.youtube.com/@RocketEvoRL" className={styles.link}>
            Tout voir sur YouTube →
          </Reveal>
        </div>
        <div className={styles.grid}>
          {latestVideos.map((video, i) => (
            <Reveal
              key={video.id}
              delay={i * 90}
              as="a"
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener"
              className={styles.thumb}
            >
              <img
                src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                alt={video.title}
                loading="lazy"
                className={styles.thumbImg}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
