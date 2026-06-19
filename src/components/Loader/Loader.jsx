import styles from './Loader.module.scss';

export default function Loader({ message = 'Загрузка...' }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
