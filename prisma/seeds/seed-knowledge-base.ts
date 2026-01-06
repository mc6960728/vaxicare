import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Knowledge Base Articles Data
const articlesData = [
  {
    title: 'Why is vaccination so important? What does it do?',
    description: 'Learn about the importance of vaccination and how it protects both individuals and communities from serious diseases.',
    content: `Vaccination is one of the most effective ways to prevent diseases. When you get vaccinated, you're not just protecting yourself – you're also helping to protect your entire community.

How Vaccines Work:
Vaccines contain weakened or inactive parts of a particular organism (antigen) that triggers an immune response within the body. This helps your immune system recognize and fight the disease if you're exposed to it in the future.

Community Protection (Herd Immunity):
When a large portion of a community is immunized against a contagious disease, most members of the community are protected against that disease because there is little opportunity for an outbreak. This is especially important for people who cannot be vaccinated, such as infants or those with weakened immune systems.

Preventing Serious Diseases:
Vaccines prevent diseases that can cause serious health complications, disabilities, or even death. Diseases like measles, polio, and whooping cough were once common but are now rare in countries with strong vaccination programs.

Long-term Benefits:
Vaccination has led to the global eradication of smallpox and has brought us close to eliminating polio. Many other diseases that once caused widespread illness and death are now controlled through vaccination programs.`,
    imageUrl: 'https://images.unsplash.com/photo-1632053002928-9e9eee4e9dcd?w=800',
    category: 'vaccination',
    isPublished: true,
    viewCount: 1247,
  },
  {
    title: 'Complete Infant & Child Vaccination Schedule',
    description: 'A comprehensive guide to infant and child vaccination schedules, covering all essential vaccines from birth to 12 years.',
    content: `Understanding your child's vaccination schedule is crucial for ensuring they receive timely protection against preventable diseases.

Birth to 6 Weeks:
• BCG (Bacillus Calmette-Guérin) - Protection against tuberculosis
• Hepatitis B (1st dose) - Protection against hepatitis B virus
• OPV (Oral Polio Vaccine) - Birth dose

6 Weeks:
• DTwP/DTaP (1st dose) - Diphtheria, Tetanus, and Pertussis
• IPV (1st dose) - Inactivated Polio Vaccine
• Hib (1st dose) - Haemophilus influenzae type b
• Hepatitis B (2nd dose)
• PCV (1st dose) - Pneumococcal Conjugate Vaccine
• Rotavirus (1st dose)

10 Weeks:
• DTwP/DTaP (2nd dose)
• IPV (2nd dose)
• Hib (2nd dose)
• PCV (2nd dose)
• Rotavirus (2nd dose)

14 Weeks:
• DTwP/DTaP (3rd dose)
• IPV (3rd dose)
• Hib (3rd dose)
• PCV (3rd dose)
• Rotavirus (3rd dose)

6 Months:
• OPV (1st booster)
• Hepatitis B (3rd dose)

9-12 Months:
• MMR (1st dose) - Measles, Mumps, Rubella
• Typhoid Conjugate Vaccine
• PCV Booster

15-18 Months:
• MMR (2nd dose)
• Varicella (Chickenpox)
• DTwP/DTaP (1st booster)
• IPV (1st booster)
• Hib (booster)

18-24 Months:
• Hepatitis A (2 doses, 6 months apart)

4-6 Years:
• DTwP/DTaP (2nd booster)
• OPV (2nd booster)
• MMR (3rd dose - optional)

10-12 Years:
• Tdap/Td (booster)
• HPV (2-3 doses) - Human Papillomavirus

Important Notes:
• Always consult with your pediatrician about the best schedule for your child
• Some vaccines may be combined to reduce the number of injections
• Keep your child's vaccination record up to date
• Mild side effects like low-grade fever or soreness at injection site are normal`,
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
    category: 'vaccination',
    isPublished: true,
    viewCount: 2156,
  },
  {
    title: 'Understanding Vaccine Side Effects: What to Expect',
    description: 'Learn about common vaccine side effects, how to manage them, and when to seek medical attention.',
    content: `Most vaccine side effects are minor and temporary. Understanding what to expect can help you care for your child after vaccination.

Common Side Effects:

1. Pain, Redness, or Swelling at Injection Site
• Usually lasts 1-2 days
• Apply a cool, clean cloth to reduce discomfort
• Gentle movement of the arm or leg can help

2. Low-Grade Fever
• Normal immune system response
• Usually resolves within 24-48 hours
• Give plenty of fluids
• Dress child in light clothing
• Consult doctor if fever exceeds 102°F (38.9°C)

3. Irritability or Fussiness
• May last for a day or two
• Extra cuddles and comfort help
• Normal sleep patterns usually return quickly

4. Mild Rash
• Some vaccines may cause a mild rash
• Usually appears within days to weeks after vaccination
• Typically resolves on its own

When to Contact Your Doctor:

Seek immediate medical attention if your child experiences:
• High fever (over 104°F/40°C)
• Seizures or convulsions
• Difficulty breathing
• Severe allergic reaction (hives, swelling, difficulty breathing)
• Extreme drowsiness or unresponsiveness
• Persistent crying for more than 3 hours

Managing Discomfort:

Pain Relief:
• Acetaminophen or ibuprofen (ask pediatrician for correct dose)
• Cool compress at injection site
• Gentle massage around the area

Fever Management:
• Keep child hydrated
• Light clothing and room temperature
• Monitor temperature regularly
• Do not give aspirin to children

Remember:
The benefits of vaccination far outweigh the risks of temporary side effects. Serious side effects are extremely rare. If you have concerns about your child's reaction to a vaccine, always consult your healthcare provider.`,
    imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800',
    category: 'health',
    isPublished: true,
    viewCount: 1893,
  },
  {
    title: 'Preparing Your Child for Vaccination Day',
    description: 'Practical tips and strategies to help prepare your child for vaccination and make the experience less stressful.',
    content: `Making vaccination day less stressful for both you and your child is important. Here are some tips to prepare.

Before the Appointment:

1. Stay Calm and Positive
• Children can sense your anxiety
• Use positive language about the visit
• Avoid saying "it won't hurt" - be honest but reassuring
• Say something like "you might feel a quick pinch"

2. Bring Comfort Items
• Favorite toy or blanket
• Comfort object from home
• Pacifier for infants

3. Dress Appropriately
• Wear clothes that provide easy access to vaccination sites
• Comfortable clothing for both parent and child
• Layers that can be easily removed if needed

4. Keep Child Well-Fed and Rested
• Feed your baby shortly before the appointment
• Ensure adequate sleep the night before
• Bring snacks for older children

During the Vaccination:

For Infants (0-12 months):
• Breastfeed during or immediately after
• Hold child securely and calmly
• Use a soothing voice
• Maintain skin-to-skin contact when possible

For Toddlers (1-3 years):
• Let them sit on your lap
• Distract with a toy or song
• Stay calm and reassuring
• Praise them afterward

For Older Children (3+ years):
• Explain what will happen in simple terms
• Let them ask questions
• Teach deep breathing techniques
• Allow them to participate (choosing which arm, counting to three)
• Use distraction techniques (videos, conversation)

After the Vaccination:

Immediate Care:
• Apply gentle pressure to injection site if bleeding
• Offer comfort and praise
• Watch for immediate reactions (15-20 minutes)

At Home:
• Monitor for side effects
• Follow doctor's recommendations for pain/fever management
• Encourage normal activities if child feels well
• Keep vaccination record updated

Reward and Praise:
• Verbal praise for being brave
• Small reward or treat
• Special activity afterward
• Sticker or certificate of bravery

Important Reminders:
• Never threaten or punish a child who is scared
• Don't apologize for the vaccination
• Be matter-of-fact but empathetic
• Your calm demeanor helps your child stay calm`,
    imageUrl: 'https://images.unsplash.com/photo-1631217850757-2e3ba4a08aec?w=800',
    category: 'parenting',
    isPublished: true,
    viewCount: 1542,
  },
  {
    title: 'Debunking Common Vaccine Myths: Facts vs Fiction',
    description: 'Evidence-based answers to common vaccine myths and misconceptions that worry parents.',
    content: `There are many myths about vaccines that can cause unnecessary worry. Let's separate fact from fiction.

Myth 1: "Vaccines cause autism"
FICTION
FACT: Extensive research involving millions of children has found no link between vaccines and autism. The original study claiming this link has been thoroughly discredited and retracted.

Myth 2: "Natural immunity is better than vaccine-acquired immunity"
FICTION
FACT: While natural immunity can be effective, the risks of serious complications from natural infection far outweigh the risks of vaccination. Vaccines provide protection without the dangerous consequences of actual diseases.

Myth 3: "Vaccines contain dangerous toxins"
FICTION
FACT: The ingredients in vaccines are present in very small amounts and are carefully studied for safety. Many of these substances occur naturally in the body, food, and environment in much larger amounts than found in vaccines.

Myth 4: "Too many vaccines overwhelm a child's immune system"
FICTION
FACT: Children's immune systems can handle thousands of antigens at once. The number of antigens in all recommended childhood vaccines combined is far less than what children encounter in their daily environment.

Myth 5: "If everyone else is vaccinated, my child doesn't need to be"
FICTION
FACT: This thinking puts your child and others at risk. Not all children can be vaccinated due to medical reasons, and they depend on community immunity. Additionally, vaccine coverage needs to be high to maintain this protection.

Myth 6: "Vaccines aren't necessary anymore because diseases are rare"
FICTION
FACT: Diseases are rare precisely because of vaccines. If vaccination rates drop, these diseases can and do return. Recent outbreaks of measles in areas with low vaccination rates prove this.

Myth 7: "Vaccines have serious side effects"
FICTION
FACT: Serious side effects are extremely rare. The common side effects (soreness, mild fever) are minor and temporary. The risks from vaccine-preventable diseases are far greater.

Myth 8: "You can get the disease from the vaccine"
FICTION
FACT: Most vaccines don't contain live viruses, so they cannot cause the disease. Even vaccines with weakened live viruses are designed not to cause disease in people with healthy immune systems.

The Truth About Vaccines:
• Vaccines are among the safest and most effective public health interventions
• They undergo extensive testing before approval
• They're continuously monitored for safety
• Benefits far outweigh risks
• They've saved millions of lives worldwide
• They're recommended by virtually all major medical and scientific organizations

Trust Science:
Vaccination decisions should be based on scientific evidence, not myths or misinformation. Always discuss concerns with qualified healthcare professionals who can provide accurate, evidence-based information.`,
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    category: 'vaccination',
    isPublished: true,
    viewCount: 3421,
  },
  {
    title: 'What to Do If Your Child Missed a Vaccination',
    description: 'Guidance on catch-up vaccination schedules and what to do if your child has missed recommended vaccines.',
    content: `Life happens, and sometimes children miss scheduled vaccinations. Here's what you need to know about catch-up schedules.

Don't Panic:
Missing a vaccination appointment doesn't mean starting over. Most vaccination schedules have some flexibility, and catch-up schedules are available.

Steps to Take:

1. Contact Your Pediatrician Immediately
• Schedule a catch-up appointment as soon as possible
• Discuss the best catch-up schedule for your child
• Ask about combining vaccines to get back on track faster

2. Bring Vaccination Records
• Complete history helps create accurate catch-up plan
• Prevents unnecessary re-vaccination
• Helps identify which vaccines are needed

3. Follow Recommended Intervals
• Minimum intervals between doses must be respected
• Some vaccines can be given simultaneously
• Your doctor will create a safe catch-up schedule

Catch-Up Vaccination Guidelines:
• Vaccines don't need to be restarted if delayed
• Longer-than-recommended intervals don't reduce final immunity
• However, children remain vulnerable until the series is complete
• Catch-up schedules can often get children protected faster

Common Scenarios:

1. Delayed by a Few Weeks:
• Simply resume the schedule where you left off
• No need to restart the series
• Try to maintain recommended intervals going forward

2. Delayed by Months:
• Consult with doctor for catch-up schedule
• May be able to combine vaccines
• Focus on getting essential vaccines first

3. No Vaccination History:
• Age-appropriate catch-up schedule available
• Blood tests can check immunity to some diseases
• Systematic approach to get fully protected

Priority Vaccines for Catch-Up:

High Priority:
1. MMR (Measles, Mumps, Rubella)
2. DTaP (Diphtheria, Tetanus, Pertussis)
3. Polio
4. Hepatitis B
5. Hib (for children under 5)

Preventing Future Delays:
• Set up reminder systems
• Schedule next appointment before leaving clinic
• Add vaccination dates to family calendar
• Use mobile apps for vaccination tracking
• Keep backup of vaccination records

Important Reminders:
• Never try to "double up" doses without medical advice
• Don't skip vaccines to catch up faster
• Follow your doctor's recommended catch-up plan
• Keep all catch-up appointments
• Update vaccination records after each visit

Global Travel Considerations:
If planning international travel and behind on vaccines, inform your doctor immediately. Some destinations require specific vaccinations, and catch-up may need to be accelerated.

The Bottom Line:
It's never too late to catch up on vaccinations. The most important thing is to resume vaccinations as soon as possible to protect your child from preventable diseases.`,
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
    category: 'vaccination',
    isPublished: true,
    viewCount: 987,
  },
];

async function main() {
  console.log('🌱 Starting knowledge base seed...\n');

  // Check if articles already exist
  const existingCount = await prisma.knowledgeBase.count();
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing articles.`);

    const args = process.argv.slice(2);
    if (!args.includes('--force')) {
      console.log('   Use --force flag to override: npx tsx prisma/seeds/seed-knowledge-base.ts --force\n');
      return;
    }

    console.log('   --force flag detected. Deleting existing articles...\n');
    await prisma.knowledgeBase.deleteMany({});
  }

  console.log('📚 Creating knowledge base articles...\n');

  for (const article of articlesData) {
    await prisma.knowledgeBase.create({
      data: article,
    });
    console.log(`   ✓ ${article.title.substring(0, 50)}...`);
  }

  console.log(`\n✅ Created ${articlesData.length} articles successfully!`);

  // Show summary by category
  console.log('\n📊 Summary by Category:');
  const summary = await prisma.knowledgeBase.groupBy({
    by: ['category'],
    _count: { id: true },
  });

  for (const group of summary) {
    console.log(`   ${group.category}: ${group._count.id} articles`);
  }

  console.log('\n✨ Knowledge base seed completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
