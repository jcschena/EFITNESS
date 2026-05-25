import { getDb } from '/Users/jcschena/Documents/EFITNESS/src/lib/db';

async function main() {
  const db = await getDb();
  
  const user = await db.get('SELECT * FROM users WHERE id = 3');
  console.log('User:', user);
  
  const plan = await db.get('SELECT * FROM training_plans WHERE user_id = 3 AND active = 1');
  console.log('Active Plan:', plan);
  
  if (plan) {
    const workouts = await db.all('SELECT * FROM workouts WHERE plan_id = ? ORDER BY day_of_week ASC', plan.id);
    console.log('Workouts (Count:', workouts.length, '):');
    workouts.forEach(w => {
      console.log(`- Day ${w.day_of_week}: ${w.title} (${w.type}) | Dist: ${w.distance_target} km | Dur: ${w.duration_target} s | TSS: ${w.tss_target} | Status: ${w.status}`);
    });
  }
}

main().catch(console.error);
