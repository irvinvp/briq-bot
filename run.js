const fetch = require("node-fetch");
const html2json = require("html2json").html2json;
const { Telegraf } = require("telegraf");
const bot = new Telegraf(""); // here put bot key
const fs = require("fs");
let tele_list = {};
try {
  tele_list = JSON.parse(fs.readFileSync("tele_list.json"));
} catch (err) {
  tele_list = {};
  fs.writeFileSync("tele_list.json", "{}");
}
let camp_run = {};
try {
  camp_run = JSON.parse(fs.readFileSync("data_camps.json"));
} catch (err) {
  camp_run = {};
  fs.writeFileSync("data_camps.json", "{}");
}
bot.start(function (ctx) {
  if (typeof tele_list[ctx.update.message.from.id] == "undefined") {
    tele_list[ctx.update.message.from.id] = "OK";
    fs.writeFileSync("tele_list.json", JSON.stringify(tele_list));
  }
  let c_ = "*** Campañas activas ***\n\n";
  for (let x in camp_run) {
    c_ =
      c_ +
      "(" +
      (camp_run[x].campaign_instrument == "trust_rights"
        ? "copropiedad"
        : camp_run[x].campaign_instrument == "senior_debt"
        ? "deuda"
        : camp_run[x].campaign_instrument == "mezzanine_debt"
        ? "deuda mezz"
        : camp_run[x].campaign_instrument) +
      ") " +
      x +
      " - " +
      camp_run[x].funding_progress +
      "%" +
      "\n\n";
  }
  ctx.reply("Bienvenido a Briq Bot\n\n" + c_);
});
bot.on("message", function (ctx) {
  //console.log(ctx.update.message.from.id, ctx.update.message.text);
  if (typeof tele_list[ctx.update.message.from.id] == "undefined") {
    tele_list[ctx.update.message.from.id] = "OK";
    fs.writeFileSync("tele_list.json", JSON.stringify(tele_list));
  }
  let c_ = "*** Campañas activas ***\n\n";
  for (let x in camp_run) {
    c_ =
      c_ +
      "(" +
      (camp_run[x].campaign_instrument == "trust_rights"
        ? "copropiedad"
        : camp_run[x].campaign_instrument == "senior_debt"
        ? "deuda"
        : camp_run[x].campaign_instrument == "mezzanine_debt"
        ? "deuda mezz"
        : camp_run[x].campaign_instrument) +
      ") " +
      x +
      " - " +
      camp_run[x].funding_progress +
      "%" +
      "\n\n";
  }
  bot.telegram.sendMessage(ctx.update.message.from.id, c_);
});
function run() {
  let current_ = {};
  let ok_run = false;
  fetch("https://www.briq.mx/proyectos")
    .then((res) => res.text())
    .then(function (body) {
      let camps =
        html2json(body).child[0].child[3].child[13].child[1].child[1].child[5]
          .child;
      for (let x in camps) {
        if (camps[x].node == "element") {
          ok_run = true;
          for (let y in camps[x].child[1].child) {
            if (camps[x].child[1].child[y].node == "element") {
              let new_c = JSON.parse(
                camps[x].child[1].child[y].child[1].attr[
                  "data-project-clicked-tracker-event-data"
                ]
                  .join(" ")
                  .replace(/&quot;/g, '"')
              );
              current_[new_c.campaign_name] = new_c;
              if (typeof camp_run[new_c.campaign_name] == "undefined") {
                let msg_ =
                  "Nueva - " +
                  "(" +
                  (new_c.campaign_instrument == "trust_rights"
                    ? "copropiedad"
                    : new_c.campaign_instrument == "senior_debt"
                    ? "deuda"
                    : new_c.campaign_instrument == "mezzanine_debt"
                    ? "deuda mezz"
                    : new_c.campaign_instrument) +
                  ") " +
                  new_c.campaign_name;
                console.log(msg_);
                camp_run[new_c.campaign_name] = new_c;
                for (let w in tele_list) {
                  if (tele_list[w] == "OK") {
                    try {
                      bot.telegram.sendMessage(w, msg_);
                    } catch (e) {
                      console.log(e);
                    }
                  }
                }
              } else {
                if (
                  parseInt(camp_run[new_c.campaign_name].funding_progress) +
                    10 <
                    parseInt(new_c.funding_progress) ||
                  parseInt(new_c.funding_progress) > 99
                ) {
                  let msg_ =
                    new_c.campaign_name + " (" + new_c.funding_progress + "%)";
                  console.log(msg_);
                  camp_run[new_c.campaign_name] = new_c;
                  for (let w in tele_list) {
                    if (tele_list[w] == "OK") {
                      try {
                        bot.telegram.sendMessage(w, msg_);
                      } catch (e) {
                        console.log(e);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (ok_run) {
        for (let c in camp_run) {
          if (typeof current_[c] == "undefined") {
            let msg_ = "Terminada - " + camp_run[c].campaign_name;
            console.log(msg_);
            for (let w in tele_list) {
              if (tele_list[w] == "OK") {
                try {
                  bot.telegram.sendMessage(w, msg_);
                } catch (e) {
                  console.log(e);
                }
              }
            }
            delete camp_run[c];
          }
        }
        fs.writeFileSync("data_camps.json", JSON.stringify(camp_run));
      }
    });
}
setInterval(run, 5 * 60 * 1000);
run();
bot.launch();
