import prisma from '../src/utils/db.js';

/**
 * Creates a "public" group that all users can see
 * Events in this group are visible to everyone
 */
async function createPublicGroup() {
  try {
    console.log('\n=== Öffentliche Gruppe erstellen ===\n');

    // Check if public group already exists
    const existingGroup = await prisma.group.findFirst({
      where: { name: 'public' }
    });

    if (existingGroup) {
      console.log('ℹ️  Gruppe "public" existiert bereits');
      console.log(`ID: ${existingGroup.id}`);
      console.log(`Erstellt am: ${existingGroup.createdAt}\n`);
      process.exit(0);
    }

    // Create public group
    const publicGroup = await prisma.group.create({
      data: {
        name: 'public'
      }
    });

    console.log('✅ Öffentliche Gruppe "public" erfolgreich erstellt!');
    console.log(`ID: ${publicGroup.id}`);
    console.log(`Erstellt am: ${publicGroup.createdAt}`);
    console.log('\nAlle Benutzer können Einträge in dieser Gruppe sehen.\n');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Gruppe:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createPublicGroup();
