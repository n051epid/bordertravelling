import { db } from '../src/db/index.js';
import { routes } from '../src/db/schema.js';

const borderRoutes = [
  {
    name: 'China National Highway 219',
    routeNumber: 'G219',
    country: 'China',
    description: 'The China National Highway 219 runs from Youyiguan, Guangxi to the Xinjiang border. One of the most scenic routes in China.',
    totalLength: 10836,
    startPoint: 'Youyiguan, Guangxi',
    endPoint: 'Kashgar, Xinjiang',
  },
  {
    name: 'U.S. Route 331',
    routeNumber: 'US331',
    country: 'United States',
    description: 'US Route 331 runs from Hampton, Florida to the Mexican border at Brownsville, Texas.',
    totalLength: 1881,
    startPoint: 'Hampton, Florida',
    endPoint: 'Brownsville, Texas',
  },
  {
    name: 'U.S. Route 228',
    routeNumber: 'US228',
    country: 'United States',
    description: 'US Route 228 runs from Halfway, Oregon to the Canadian border near Jaffray, British Columbia.',
    totalLength: 1100,
    startPoint: 'Halfway, Oregon',
    endPoint: 'Jaffray, British Columbia (Canada border)',
  },
];

async function seedRoutes() {
  console.log('Seeding routes...');
  
  for (const route of borderRoutes) {
    await db.insert(routes).values(route).onConflictDoNothing();
    console.log(`Inserted route: ${route.routeNumber} - ${route.name}`);
  }
  
  console.log('Seeding complete!');
  process.exit(0);
}

seedRoutes().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
