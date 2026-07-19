/**
 * embed.js
 * --------
 * Lets staff build and send a custom embed to a channel using a modal
 * form (title, description, color, image URL, channel).
 * The modal submission is handled inline via awaitModalSubmit rather than
 * routing through interactionCreate.js, since it's a self-contained flow
 * scoped to a single command invocation.
 */

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embeds');
const config = require('../../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Build and send a custom embed to a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((opt) =>
      opt.setName('channel').setDescription('Channel to send the embed to (defaults to this channel)')
    ),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const modal = new ModalBuilder().setCustomId(`embedbuilder_${targetChannel.id}`).setTitle('Embed Builder');

    const titleInput = new TextInputBuilder()
      .setCustomId('embed_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(256);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('embed_description')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const colorInput = new TextInputBuilder()
      .setCustomId('embed_color')
      .setLabel('Color (hex, e.g. #5865F2)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(7);

    const imageInput = new TextInputBuilder()
      .setCustomId('embed_image')
      .setLabel('Image URL (optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descriptionInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);

    const submitted = await interaction
      .awaitModalSubmit({
        time: 300_000,
        filter: (i) => i.customId === `embedbuilder_${targetChannel.id}` && i.user.id === interaction.user.id,
      })
      .catch(() => null);

    if (!submitted) return;

    const title = submitted.fields.getTextInputValue('embed_title');
    const description = submitted.fields.getTextInputValue('embed_description');
    const color = submitted.fields.getTextInputValue('embed_color') || config.embedColor;
    const image = submitted.fields.getTextInputValue('embed_image');

    const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
    if (color && !hexPattern.test(color)) {
      return submitted.reply({ embeds: [errorEmbed('Invalid hex color. Example: `#5865F2`')], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color.startsWith('#') ? color : `#${color}`);

    if (image) embed.setImage(image);

    try {
      await targetChannel.send({ embeds: [embed] });
      await submitted.reply({ embeds: [successEmbed(`Embed sent to ${targetChannel}.`)], ephemeral: true });
    } catch (err) {
      console.error('[embed] Failed to send embed:', err);
      await submitted.reply({ embeds: [errorEmbed('Failed to send the embed. Check my permissions in that channel.')], ephemeral: true });
    }
  },
};
