import fs from 'fs';
import path from 'path';
import { TRAINING_LIBRARY } from './training-library';

const outputDir = path.resolve(__dirname, '../../public/planilhas');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

Object.values(TRAINING_LIBRARY).forEach((plan) => {
  const workouts = plan.generateWeeks(100);
  const jsonContent = {
    id: plan.id,
    name: plan.name,
    author: plan.author,
    source: plan.source,
    sport: plan.sport,
    weeks: plan.weeks,
    level: plan.level,
    description: plan.description,
    workouts: workouts
  };
  const filePath = path.join(outputDir, `${plan.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2), 'utf-8');
  console.log(`Exported ${plan.id} to ${filePath}`);
});
