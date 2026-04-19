import { db } from '../src/db/index.js';
import { routes } from '../src/db/schema.js';

const borderRoutes = [
  {
    name: 'G219 国道（边境线）',
    routeNumber: 'G219',
    country: 'China',
    description: '中国最长边境公路，全长约10,000公里，连接广西东兴至新疆喀纳斯，沿途经过多个边境口岸和少数民族地区',
    totalLength: 10065,
    startPoint: '广西壮族自治区东兴市',
    endPoint: '新疆维吾尔自治区喀纳斯景区',
  },
  {
    name: 'G331 国道（边境线）',
    routeNumber: 'G331',
    country: 'China',
    description: '沿中国北部边境的公路，全长约9,000公里，从辽宁丹东至新疆阿勒泰，经过东北三省、内蒙古和甘肃',
    totalLength: 9000,
    startPoint: '辽宁省丹东市',
    endPoint: '新疆维吾尔自治区阿勒泰地区',
  },
  {
    name: 'G228 国道（海岸线）',
    routeNumber: 'G228',
    country: 'China',
    description: '中国东部沿海公路，全长约7,000公里，从辽宁丹东至广西东兴，串联中国海岸线城市',
    totalLength: 7000,
    startPoint: '辽宁省丹东市',
    endPoint: '广西壮族自治区东兴市',
  },
];

async function seed() {
  console.log('Seeding routes...');
  for (const route of borderRoutes) {
    await db.insert(routes).values(route).onConflictDoNothing();
    console.log(`  Inserted: ${route.routeNumber} - ${route.name}`);
  }
  console.log('Seed complete.');
}

seed().catch(console.error);
