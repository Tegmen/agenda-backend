import prisma from '../src/utils/db.js';
import { hashPassword } from '../src/utils/auth.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n=== Admin-Benutzer erstellen ===\n');

    const username = await question('Admin-Benutzername: ');
    const password = await question('Admin-Passwort (min. 6 Zeichen): ');

    if (!username || !password) {
      console.log('❌ Benutzername und Passwort sind erforderlich');
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('❌ Passwort muss mindestens 6 Zeichen lang sein');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      console.log('❌ Benutzername bereits vergeben');
      process.exit(1);
    }

    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log(`\n✅ Admin-Benutzer "${admin.username}" erfolgreich erstellt!`);
    console.log(`ID: ${admin.id}`);
    console.log(`Rolle: ${admin.role}`);
    console.log(`Erstellt am: ${admin.createdAt}\n`);
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Admins:', error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();
