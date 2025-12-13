import styles from "./styles.module.css";

export const Article = ({ children }: { children: React.ReactNode }) => {
  return <article className={styles.article}>{children}</article>;
};

export const Main = ({ children }: { children: React.ReactNode }) => {
  return <main className={styles.main}>{children}</main>;
};

export const Root = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.root}>{children}</div>;
};
