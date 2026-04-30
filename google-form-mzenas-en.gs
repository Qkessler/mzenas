function createEnglishMzenasForm() {
  const form = FormApp.create('Help us improve your restaurant experience');

  form.setDescription(
    'We are building Mzenas, a faster way to order and pay in restaurants from your phone without downloading an app. Your answers will help us understand what diners value most.'
  );

  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setPublishingSummary(false);
  form.setConfirmationMessage('Thanks for your feedback. Your answers help us build a better restaurant experience.');

  form.addMultipleChoiceItem()
    .setTitle('What is your age range?')
    .setChoiceValues(['20-30', '30-40', '40-50', '50+'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('How often do you go out for dinner?')
    .setChoiceValues([
      'Several times a week',
      'Once a week',
      'Two to three times a month',
      'Once a month or less'
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('What frustrates you most when you are in a bar or restaurant?')
    .setChoiceValues([
      'Waiting for my order to be taken',
      'Waiting to pay',
      'Not being able to call the waiter easily',
      'Mistakes in the order',
      'Menu that is hard to read or out of date',
      'High ambient noise',
      'Not enough product information (size, allergens, images, etc.)',
      'Allergens not being clearly indicated',
      'Waiting to be seated',
      'No gluten-free food'
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Have you ever used your phone to order or pay in a restaurant?')
    .setChoiceValues([
      'Yes, and I found it convenient and fast',
      'Yes, but I prefer to do it through the waiter',
      'No, but I would try it',
      'No, I prefer the traditional system'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('If you could order from your phone by scanning a QR code at the table, without downloading an app, would you use it?')
    .setChoiceValues(['Yes', 'Maybe', 'No'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('What would give you more confidence when using this system?')
    .setChoiceValues([
      'Knowing the order goes directly to the kitchen without mistakes',
      'Seeing the status of my order in real time',
      'Being able to pay from my phone without waiting for the waiter',
      'Not having to download any app',
      'The restaurant itself recommending it to me'
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('How do you usually decide where to go for lunch or dinner?')
    .setChoiceValues([
      'Google Maps',
      'Recommendation from friends or family',
      'Social media (Instagram, TikTok...)',
      'I walk past and go in',
      'I always go to the same trusted places',
      'The Fork or other reservation apps'
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Would you be interested in receiving real-time offers from nearby restaurants when you are deciding where to go?')
    .setChoiceValues([
      'Yes, any offer interests me',
      'Yes, if they are relevant to my tastes',
      'It depends on the restaurant',
      'No, I prefer not to receive this type of notification'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('Have you ever decided not to order something (another beer, a dessert, a coffee) because the waiter was taking too long?')
    .setChoiceValues([
      'Yes, it happens to me often',
      'Yes, it has happened to me before',
      'Rarely',
      'No, I always wait without a problem'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('How long do you consider it acceptable to wait for your order to be taken?')
    .setChoiceValues([
      'Less than 5 minutes',
      'Between 5 and 10 minutes',
      'Between 10 and 15 minutes',
      'I do not mind the wait if the service is good'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('What payment method do you usually use in bars or restaurants?')
    .setChoiceValues(['Debit or credit card', 'Cash'])
    .showOtherOption(true)
    .setRequired(true);

  form.addScaleItem()
    .setTitle('How would you feel about paying the bill directly from your phone (Google Pay / Apple Pay) instead of waiting for the card reader?')
    .setBounds(1, 5)
    .setLabels('I would not use it', 'I would love it')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Would you leave us your email so we can notify you when we launch Mzenas in your city?')
    .setHelpText('Optional')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('Tell us your opinion')
    .setHelpText('Optional')
    .setRequired(false);

  Logger.log('Edit URL: ' + form.getEditUrl());
  Logger.log('Public URL: ' + form.getPublishedUrl());
}
