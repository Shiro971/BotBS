const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ticketOwners = require('../ticketOwners');

module.exports = {
    handleCommand: async (interaction) => {

            const REQUIRED_ROLE_ID = '1076685983724085371';

            if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return interaction.reply({
                content: '⛔ Vous n\'avez pas le rôle requis pour utiliser cette commande.',
                ephemeral: true,
            });
            }
        // Créer des boutons pour confirmer ou annuler
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_ref')
                    .setLabel('Confirmer le refus')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_ref')
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Demander confirmation
        await interaction.reply({
            content: '⚠️ Vous êtes sur le point d\'envoyer un message de refus au candidat. Confirmez-vous ?',
            components: [row],
            ephemeral: true
        });
    },

handleButton: async (interaction) => {
    if (interaction.customId === 'confirm_ref') {
        await interaction.update({
            content: '✅ Message de refus en cours d\'envoi...',
            components: [],
            ephemeral: true
        });

        // Récupérer l'ID du propriétaire du ticket
        const ownerId = ticketOwners.get(interaction.channel.id);
        if (!ownerId) {
            console.error(`❌ Aucun propriétaire associé au channel ${interaction.channel.id}`);
            return interaction.followUp({ content: '❌ Impossible de trouver le propriétaire du ticket.', ephemeral: true });
        }
        
        // Tenter de fetch le membre
        let user;
        try {
            user = await interaction.guild.members.fetch(ownerId);
            console.log(`✅ Utilisateur récupéré: ${user.user.tag}`);
        } catch (error) {
            console.error('❌ Impossible de fetch l\'utilisateur:', error);
            return interaction.followUp({ content: '❌ Impossible de récupérer l\'utilisateur.', ephemeral: true });
        }

        // Renommer le channel
        try {
            const channel = interaction.channel;
            const newChannelName = `Candidature refusée ❌`
            .toLowerCase()
            .replace(/[^a-z0-9-\s]/g, '') // autorise espace \s
            .replace(/\s+/g, '-') // remplace les espaces par des tirets
            .substring(0, 32);            
            await channel.setName(newChannelName);
            console.log(`Channel name updated to: ${newChannelName}`);
        } catch (error) {
            console.error(`Failed to update channel name: ${error}`);
            return interaction.followUp({ content: '⚠️ Erreur lors de la modification du nom du channel.', ephemeral: true });
        }

        // Construire et envoyer le message embed
        const refusalEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('Candidature refusée ❌')
            .setDescription(`Merci beaucoup pour l'intérêt que vous avez porté au Burger Shot 🍔

Après une réflexion approfondie, nous avons décidé de ne pas donner suite à votre candidature.
Nous vous souhaitons beaucoup de succès dans vos projets futurs. 🙏

Après avoir lu ce message, nous vous invitons à fermer votre ticket !

Cordialement,
L'équipe de recrutement du Burger Shot`);

        await interaction.channel.send({ embeds: [refusalEmbed] });

        // Mentionner le candidat à part
        await interaction.channel.send({ content: `<@${user.id}>` });

        console.log('Message de refus envoyé.');
    } else if (interaction.customId === 'cancel_ref') {
        await interaction.update({
            content: '❌ Refus annulé',
            components: [],
            ephemeral: true
        });
    }
}



};