const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  InteractionResponseFlags
} = require('discord.js');

const ID_ROLE_BURGER_SHOT = '1076638219858346132';
let employesBurgerShot = [];
const sessionsEnCours = new Map();
const suiviQuotas = new Map();

async function majEmployesBurgerShot(guild) {
  await guild.members.fetch(); 
  const membres = guild.members.cache.filter(member =>
    member.roles.cache.has(ID_ROLE_BURGER_SHOT)
  );

  employesBurgerShot = membres.map(member => {
    const grade = getGradeDepuisRoles(member); 
    return {
      id: member.user.id,
      pseudo: member.user.username,
      displayName: member.displayName,
      grade: grade
    };
  });

  //console.log('[BurgerShot] Employés mis à jour :', employesBurgerShot);
}

function getTauxHoraire(grade) {
  switch (grade) {
    case 'apprenti': return 1600;
    case 'employé': return 1800;
    case 'qualifié': return 2000;
    default: return 0;
  }
}


function ajouterHeuresEtPaye(playerDiscord, playerCharacter, heures, grade) {
  const tauxHoraire = getTauxHoraire(grade);
  const paye = heures * tauxHoraire;

  if (!suiviQuotas.has(playerDiscord)) {
    suiviQuotas.set(playerDiscord, {
      nom: playerCharacter,
      heures: 0,
      paye: 0,
      ventes: 0,
      factures: 0,
      runs: 0,
      grade: grade
    });
  }

  const data = suiviQuotas.get(playerDiscord);
  data.heures += heures;
  data.paye += paye;
}

function getGradeDepuisRoles(member) {
  const ROLE_ID_APPRENTI = '1144458015538417794';
  const ROLE_ID_EMPLOYE = '1076638219858346134';
  const ROLE_ID_QUALIFIE = '1076638220114202656';

  if (member.roles.cache.has(ROLE_ID_APPRENTI)) return 'apprenti';
  if (member.roles.cache.has(ROLE_ID_EMPLOYE)) return 'employé';
  if (member.roles.cache.has(ROLE_ID_QUALIFIE)) return 'qualifié';
  return 'autre';
}

const ID_LOGS_PRISE_SERVICE = '1324888804427042947';
const ID_LOGS_FACTURE = '1325474305089470595';
const ID_LOGS_RUN = 'ID_DU_CANAL_RUN';

async function messageCreate(message) {
  if (message.webhookId && message.channel.id === ID_LOGS_PRISE_SERVICE) {
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];

      const data = {};
      embed.fields.forEach(field => {
        data[field.name] = field.value;
      });

      const action = embed.description || '';
      const playerDiscord = data['playerDiscord'] || '';
      const playerCharacter = data['playerCharacter'] || '';
      const timestamp = message.createdAt;

      console.log('✅ Webhook détecté !');
      console.log(`Action : ${action}`);
      console.log(`Discord : ${playerDiscord}`);
      console.log(`Perso : ${playerCharacter}`);
      console.log(`Timestamp : ${timestamp}`);

      if (action.toLowerCase().includes('prise de service')) {
        sessionsEnCours.set(playerDiscord, timestamp);
        console.log(`🟢 Début de service enregistré pour ${playerCharacter}`);
      }

      if (action.toLowerCase().includes('fin de service')) {
        const debut = sessionsEnCours.get(playerDiscord);
        if (!debut) {
          console.warn(`⚠️ Aucun début de service trouvé pour ${playerCharacter}`);
          return;
        }

        const fin = timestamp;
        const dureeMs = fin - debut;
        const minutes = Math.round(dureeMs / 1000 / 60);
        const heures = parseFloat((minutes / 60).toFixed(2));

        const employe = employesBurgerShot.find(emp => emp.id === playerDiscord);
        const grade = employe ? employe.grade : 'autre';

        ajouterHeuresEtPaye(playerDiscord, playerCharacter, heures, grade);

        console.log(`🔴 Fin de service pour ${playerCharacter} | ${heures} h | Grade : ${grade}`);

        sessionsEnCours.delete(playerDiscord);
      }
    }
  }
}

console.table(suiviQuotas);

module.exports = {
    majEmployesBurgerShot,
    messageCreate,
    suiviQuotas,
};