import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

const tabs = [
  { name: 'Try it', code: 'git clone https://github.com/yashksaini-coder/glint\ncd glint && npm install\nnpm start', note: 'Then choose “Try a recorded session”. No camera or key needed.' },
  { name: 'Run it', code: 'cp .env.example .env   # add PRESAGE_API_KEY\nnpm start', note: 'Press “I agree — Start camera”. The camera stays off until you do.' },
  { name: 'Test it', code: 'npm test\nnpm run smoke', note: 'Detectors on a real recording, then the app driven end to end.' },
];

export function StartTabs() {
  return (
    <Tabs items={tabs.map((t) => t.name)} className="g-start">
      {tabs.map((t) => (
        <Tab key={t.name} value={t.name}>
          <pre className="g-start-code"><code>{t.code}</code></pre>
          <p className="g-start-note">{t.note}</p>
        </Tab>
      ))}
    </Tabs>
  );
}
