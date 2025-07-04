import Head from 'next/head';
import TaskTracker from '../components/TaskTracker.jsx';

export default function Home() {
  return (
    <>
      <Head>
        <title>Task Tracker</title>
      </Head>
      <main className="p-6">
        <TaskTracker />
      </main>
    </>
  );
}
