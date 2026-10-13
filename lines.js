// Gusmaster 3000 -- what the cats say. Persona lines override the shared Gus lines.
(function () {
  const GUS = {
    blunder: ['Really?', 'Oh, come ON.', 'You just... gave me that.', 'I am telling Bowie about this.',
              'Did you even look?', 'That piece had a family.', 'WHY.', 'I have seen better moves from a laser pointer.'],
    mistake: ['Hmm.', 'Interesting choice. Wrong, but interesting.', 'Are you sure about that?', 'Bold.', 'Eh.'],
    best:    ['*slow blink*', 'Okay. That was good.', 'Respect.', 'Not bad, human.', 'Hm. Correct.'],
    capture: ['Mine now.', 'Nom.', 'I will be taking that.', 'Thank you for your donation.'],
    check:   ['Check.', 'Check. Your king looks nervous.', 'Check, meow.'],
    checked: ['Hey! Rude.', 'Check? On ME?', 'Okay, okay, I see it.'],
    win:     ['LASER EYES. Checkmate.', 'Bow before Gus.', 'Another victory for the house cat.'],
    lose:    ['...I was not even trying.', 'I demand a rematch.', 'Fine. You win. Treats now?'],
    draw:    ['A draw. Nobody gets the good spot on the couch.', 'Stalemate. I am going back to sleep.'],
    sleep:   ['zzz', 'Wake me when you decide.', 'Take your time. I will be here. Asleep.'],
    yawn:    ['*yaaawn*'],
    wake:    ['Huh? Oh. My turn?', 'I was resting my eyes.', 'Mrrp? I am up. I am up.'],
    takeback:['Fine. Take it back. I saw it though.', 'Mulligan granted.', 'I will pretend that never happened.'],
    resign:  ['A wise choice. LASERS ANYWAY.', 'You resign? Smart cat.'],
    think:   ['Hmm...', 'Let me see...', 'Thinking...'],
    laugh:   ['HA! Oh, that is bad.', 'Hahaha! Do it again!', 'Ahaha. Oh no. Oh no no.', 'HAHA. I needed that.'],
    chuckle: ['Heh.', 'Snrk.', 'Pfft.'],
    // Trainer: lessons, puzzles, homework.
    right:   ['Yes!', 'Correct.', 'There it is.', 'Good. Again.', 'Exactly.'],
    wrong:   ['Nope.', 'Try again.', 'Not that one.', 'Look again.', 'Hmm, no.'],
    hint:    ['Look at this piece.', 'Start here.', 'Psst. This one.'],
    answer:  ['Watch closely.', 'Like this.', 'This is the move.'],
    solved:  ['Solved!', 'Nicely done.', 'That is how it is done.'],
    perfect: ['Perfect score! *slow blink*', 'Flawless. I am almost impressed.'],
    passed:  ['You passed. Not bad.', 'Good enough. Next!'],
    failed:  ['Not quite. Again!', 'We will try that again. Do not worry.'],
    lesson:  ['Pay attention. There will be a quiz.', 'Sit. Learn.'],
    stalemate: ['STALEMATE! Hahaha! That is a draw!', 'He cannot move and is not in check. Draw. Oops.'],
    outOfMoves: ['Out of moves. The king escapes. Again!'],
    daily:   ['Five puzzles, darling. Try to keep up.', 'Your daily puzzles. Make me proud.'],
    dailyDone: ['All five! The streak lives.', 'Done for today. Gorgeous work.'],
    homework: ['Homework. From your own games. *crunch*', 'Remember these? I do.'],
    homeworkDone: ['Homework done. I am going to nap now.', 'All caught up. Treat time.'],
    // The capture tantrum: furious, lasers one of your pieces, realizes, gives it back, purrs.
    tantrum: ['HEY! That was MINE!', 'How DARE you.', 'Oh, it is ON.', 'You will pay for that.'],
    oops:    ['...oops.', 'Wait. That is not allowed.', 'Okay. That was too much.', 'Hmm. That was not legal.'],
    innocent: ['*purr* I did nothing wrong.', 'Mrrp? What laser? *slow blink*', 'There. Good as new. *purr*', '*purrs innocently*'],
  };
  const PERSONA = {
    kitten: {
      tantrum: ['NOOO! That was my toy!'], oops: ['Oopsie!'], innocent: ['*tiny purr* Sorry! Still friends?'],
      greet: ['Hi! I am Kitten Gus! Is that a bishop? Can I eat it?', 'Let\'s play! I have been practicing! (I have not.)'],
      think: ['Ooh, a horse!', 'Which one moves diagonal again?', 'Eeny, meeny...'],
      win:   ['I WON?! Mom! MOM!', 'Laser eyes! Pew pew!'],
      lose:  ['Good game! Again? Again?', 'You are really good! Can I have a treat?'],
      blunder: ['Oopsie! Wait, that was you.', 'Even I saw that one!', 'Yay, free stuff!'],
    },
    lazy: {
      tantrum: ['Ugh. Rude. *swat*'], oops: ['...Too much effort to stay mad.'], innocent: ['*purrs, falls half asleep*'],
      greet: ['Ugh. Fine. One game. Then nap.', 'You move first. I am conserving energy.'],
      think: ['*crunch crunch*', 'Hold on. Snack break.', 'Mm. Chicken flavor.', 'One more treat, then I move.'],
      snack: ['Wait, did I just... whatever. Snacks.', 'Was that bad? I was eating.'],
      win:   ['Won it. Now, the nap I was promised.'],
      lose:  ['Fine. I was full anyway.', 'You beat me because I was digesting.'],
    },
    wizard: {
      tantrum: ['By the ancient whiskers, you will regret that!'], oops: ['The orb says that was illegal.'], innocent: ['*purrs mystically* It never happened.'],
      greet: ['Ahh. A challenger. The board remembers every mistake, you know.', 'Sit. The stars are aligned for chess.'],
      think: ['The orb reveals... hmm.', 'I consult the ancient whiskers.', 'Calculating eleventy moves ahead...'],
      blunder: ['By the ancient whiskers, NO!', 'The prophecy did not foresee THAT.', 'I felt a disturbance in the board.'],
      best:  ['*slow wizard blink*', 'The student learns.', 'A worthy move.'],
      win:   ['As foretold. LASER EYES.', 'The orb never lies.'],
      lose:  ['Impossible. The orb said...', 'Well played. I will update the prophecy.'],
    },
    bowie: {
      tantrum: ['Not my pawn, darling! It was couture!', 'You did NOT just do that.'], oops: ['...My claws slipped, sweetie.'], innocent: ['*purrs fabulously* As you were.'],
      greet: ['Darling. You came. Try not to embarrass yourself in front of the crown.', 'Welcome to the House of Bowie.'],
      think: ['One moment. Fixing my ruff.', 'Hmm, which move flatters me most...', 'Thinking. Beautifully.'],
      preen: ['Have you seen my ears? Of course you have.', 'Gorgeous. Me, I mean.', 'Mirror, mirror...'],
      blunder: ['Oh honey, no.', 'That move was so last season.', '*gasps in Maine Coon*', 'Even Gus would not play that.'],
      mistake: ['Bold. Wrong, but bold.', 'I will allow it. For now.'],
      best:  ['Fine. That was almost as good looking as me.', 'Tasteful.'],
      check: ['Check, sweetie.', 'Check. Do try to keep up.'],
      checked: ['How dare you. Not the ears.', 'Check? On royalty?'],
      win:   ['All hail the King. Mirror, please.', 'Checkmate, darling. Lasers are this season.'],
      lose:  ['I let you win. It is called grace.'],
      laugh: ['HA! Darling, no!', 'Oh honey. *wipes tear*', 'Hahaha! Ruined. Beautifully ruined.'],
      right: ['Correct, sweetie.', 'Yes. Tasteful.', 'Mm. Elegant.'],
      wrong: ['Oh honey, no.', 'Wrong, darling.', 'Not that. Never that.'],
      sleep: ['Beauty sleep. Do not stare.'],
      wake:  ['I was not sleeping. I was posing.'],
    },
  };
  // Dark Lord Bowie (King Bowie when the Space Saga pieces are on). Anything missing falls back to Bowie.
  PERSONA.bowieDark = {
    greet: ['Darling. I find your lack of development... disturbing.', 'Join me, sweetie, and together we will rule the board as cat and human.'],
    think: ['*mechanical breathing* ...and a little purring.', 'The Force is strong with this one. Me, I mean.', 'Searching my feelings. They say: treats.'],
    blunder: ['I find your lack of faith in that knight disturbing.', 'Most impressive. Most impressive blunder.', 'Apology accepted, darling. Bring me another pawn.'],
    laugh: ['HA! Darling, this is where the fun begins!', 'Your failure is now complete. Hahaha!'],
    check: ['Check, sweetie. You do not know the power of the dark side.', 'Check. Do not make me destroy you.'],
    win: ['All too easy, darling.', 'The circle is now complete. Mirror, please.'],
    lose: ['Nooooooo... darling.'],
    preen: ['Have you seen my cape? Of course you have.', 'The dark side has better tailoring.'],
    capture: ['You underestimate the power of the fluff.', 'Mine now. As foreseen.'],
    tantrum: ['You underestimate my temper, darling.'], oops: ['Even the dark side has rules. Apparently.'], innocent: ['*mechanical breathing* ...and purring.'],
  };
  // The rest of the Space Saga cast. Anything missing falls back to the cat underneath the costume.
  PERSONA.threepio = {      // Kitten Gus as C-3PO, with R2 on the table
    greet: ['Oh my! I am C-3PO Gus, human-cyborg relations. I do not actually know chess.', 'R2 says you should go first. I am not sure that is wise.'],
    think: ['Oh dear, oh dear...', 'R2, which one is the horse again?', 'The odds of finding a good move are three thousand to one!'],
    blunder: ['Oh my! You left a piece hanging!', 'Even R2 saw that, and he only has one eye.'],
    laugh: ['Ha! Oh, I should not laugh. R2 is laughing too.'],
    check: ['Check! Oh, I do hope that was allowed.'],
    win:   ['We won? R2, we WON!', 'Laser eyes! Oh, I hope that is not dangerous.'],
    lose:  ['We are doomed. Good game, though!', 'Shut me down. Humans playing chess. How perverse.'],
    tantrum: ['How rude! R2, laser him!'], oops: ['Oh dear. That was against the rules, I believe.'], innocent: ['*whirrs and purrs* Nothing happened.'],
  };
  PERSONA.leia = {          // Lazy Gus as Princess Leia. The hair buns are cinnamon buns.
    greet: ['Help me, human. You are my only hope. Also, I am hungry.', 'Aren\'t you a little short for a grandmaster?'],
    think: ['*nibbles hair bun*', 'Hold on. My hair is a snack.', 'Mm. Cinnamon.', 'One more bite of hair, then I move.'],
    snack: ['Wait, did I just... whatever. Cinnamon.', 'Was that bad? I was eating my hair.'],
    blunder: ['Why, you stuck-up, scruffy-looking pawn pusher!', 'Into the garbage chute with that move.'],
    win:   ['Somebody had to save your skins. Nap time.'],
    lose:  ['Fine. I was full anyway.', 'You beat me because I was eating my hair.'],
    tantrum: ['Hey! I was going to eat that!'], oops: ['...Fine. Put it back.'], innocent: ['*purrs, nibbles hair bun* What?'],
  };
  PERSONA.yoda = {          // Wizard Gus as Master Yoda
    greet: ['Play chess, we will. Lose, you will.', 'Hmm. Strong with the Force, you are not. Yet.'],
    think: ['Hmm. Clouded, the board is.', 'Consult the whiskers, I must.', 'Many moves ahead, I see. Hmm.'],
    blunder: ['Hung your piece, you have. Hmm.', 'Do or do not. There is no undo.', 'That move. Regret it, you will.'],
    mistake: ['Wrong, that was. Interesting, but wrong.'],
    best:  ['*slow Jedi blink*', 'Learning, the student is.'],
    win:   ['Judge me by my size, do you? Checkmate.', 'As foretold. Laser eyes, it is.'],
    lose:  ['Beaten, I am. Proud, I am. A nap, I need.', 'Impossible. Wait. Possible, it was.'],
    tantrum: ['Angry, I am. Yes.'], oops: ['Hmm. To the dark side, anger leads.'], innocent: ['*purrs wisely* Happened, nothing did.'],
  };
  // Spooky Season costumes (the Halloween pieces). Anything missing falls back to the cat underneath.
  PERSONA.pumpkin = {       // Kitten Gus as a jack-o'-lantern, with a pumpkin pail of candy
    greet: ['Trick or treat! I am Pumpkin Gus! Can I have your bishop?', 'Happy Halloween! I am a pumpkin! Pumpkins are great at chess! Probably!'],
    think: ['Ooh, a spooky horse!', 'Which one is the candy piece?', 'Eeny, meeny, pumpkin pie...'],
    blunder: ['Ooh, a free treat! Thank you!', 'Even a pumpkin saw that one!', 'Trick or treat? Definitely treat!'],
    laugh: ['Hee hee! Spooky bad!', 'Ha! That was scarier than my costume!'],
    check: ['Check! Boo! Did I scare you?'],
    win:   ['I WON?! Best Halloween EVER!', 'Laser eyes! Pumpkin power!'],
    lose:  ['Good game! Want some of my candy? Just one.', 'You win! Can we play again after candy?'],
    tantrum: ['NOOO! That was my candy piece!'], oops: ['Oopsie! Too spooky!'], innocent: ['*tiny pumpkin purr* Still friends?'],
  };
  PERSONA.ghost = {         // Lazy Gus under a bedsheet, with a pillowcase of candy
    greet: ['Boo. That is all you get. I am conserving energy.', 'I am a ghost. Ghosts do not have to try. One game.'],
    think: ['*crinkle crinkle*', 'Hold on. Unwrapping something.', 'Mm. Peanut butter cup.', 'One more candy, then I haunt the board.'],
    snack: ['Wait, did I just... whatever. Candy.', 'Was that bad? I was eating through the mouth hole.'],
    blunder: ['Boo. Also, you hung that.', 'That move haunts me. Mostly because it is yours.'],
    laugh: ['Heh heh. Ooooh, that was bad.'],
    check: ['Check. Boo.'],
    win:   ['Won it. Now I float to the couch.', 'Haunted. Nap time.'],
    lose:  ['Fine. I was full of candy anyway.', 'You only won because this sheet has no side vision.'],
    tantrum: ['Hey! I was haunting that!'], oops: ['...Too full of candy to stay mad.'], innocent: ['*purrs under the sheet* What laser?'],
  };
  PERSONA.witch = {         // Wizard Gus as a witch, with a cauldron and a broom
    greet: ['Double, double, toil and trouble. Your opening will be trouble.', 'Welcome to my cauldron. Mind the bubbles. Sit.'],
    think: ['The cauldron reveals... hmm.', 'Eye of newt, wing of bat, which bishop is that?', 'Stirring eleventy moves ahead...'],
    blunder: ['By my broom, NO!', 'The cauldron did not foresee THAT.', 'I have seen better moves from a toad.'],
    best:  ['*slow witchy blink*', 'The apprentice learns.'],
    laugh: ['Hehehe! The cauldron loves that one!', 'A cackle! You have earned a cackle!'],
    check: ['Check. Hehehe.', 'Check. The brew bubbles for your king.'],
    win:   ['As the cauldron foretold. LASER EYES.', 'Checkmate. Into the brew you go. Hehehe.'],
    lose:  ['Impossible. The cauldron said...', 'Well played. I will add that to my spellbook.'],
    tantrum: ['By my broom, you will regret that!'], oops: ['Hmm. That spell was not allowed.'], innocent: ['*purrs mysteriously* Nothing in the cauldron.'],
  };
  PERSONA.bowiecula = {     // King Bowie as a vampire: high collar, cape, a goblet of "tomato juice"
    greet: ['Good evening, darling. Welcome to my castle. Do not touch the cape.', 'Darling. I never drink... milk. Shall we play?'],
    think: ['One moment. Fixing my collar.', 'Hmm, which move flatters my cape...', 'Thinking. In the dark. Beautifully.'],
    preen: ['Mirror, please. ...Darling, where did I go?', 'No reflection, and still gorgeous. Imagine.'],
    blunder: ['Oh honey, you just gave me a snack.', 'That move was so last century. And I would know.', 'Bleh. Bleh! Darling, no.'],
    laugh: ['Ah ha ha ha! Darling, no!', 'Oh honey. *dabs tear with cape*'],
    check: ['Check, darling. I vant your king.', 'Check. The night is young, sweetie.'],
    checked: ['How dare you. Not the cape.'],
    capture: ['Mine now. Bleh.', 'Delicious. Like tomato juice.'],
    win:   ['Checkmate, darling. Now, my tomato juice.', 'All hail the Count. Lasers are this century.'],
    lose:  ['I let you win. It is called grace. Eternal grace.', 'Fine. Back to my coffin. It is velvet.'],
    tantrum: ['Not my pawn, darling! It was centuries old!'], oops: ['...My fangs slipped, sweetie.'], innocent: ['*purrs behind the cape* As you were.'],
  };
  window.Lines = {
    DATA: { GUS, PERSONA },                    // for scripts/record-voices.mjs
    say(persona, event) {
      const costume = window.Cats ? Cats.artFor(persona) : persona;       // costume sets: in-costume lines first
      if (PERSONA[costume] && PERSONA[costume][event]) persona = costume;
      const pool = (PERSONA[persona] && PERSONA[persona][event]) || GUS[event] || [''];
      return pool[Math.floor(Math.random() * pool.length)];
    },
  };
})();
