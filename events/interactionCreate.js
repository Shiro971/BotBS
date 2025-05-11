const rdvHandler = require('../handlers/rdvHandler');
const refHandler = require('../handlers/refHandler');

module.exports = async (client, interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'acc') {
        await rdvHandler.handleCommand(interaction);
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_rdv') {
      await rdvHandler.handleModalSubmit(interaction);
    }

    if (interaction.isButton() && interaction.customId.startsWith('select_date_')) {
      await rdvHandler.handleButtons(interaction);
    }

    if (interaction.isButton() && interaction.customId === 'confirm_ref') {
      await refHandler.handleButton(interaction);
    }

  } catch (error) {
    console.error('❌ Erreur interactionCreate :', error);
  }
};
