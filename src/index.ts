import 'dotenv/config';

import readline from 'readline';
import stringSimilarity from 'string-similarity';
import { request } from 'undici';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function fetchUUID(username: string): Promise<string> {
  const { body } = await request(
    `https://playerdb.co/api/player/minecraft/${username}`,
    {
      method: 'GET',
    },
  );

  const json = await body.json();

  return json.data.player.raw_id;
}

type ItemBytes = {
  type: number;
  data: string;
};

type AuctionRaw = {
  uuid: string;
  item_name: string;
  tier: string;
  item_bytes: ItemBytes;
};

type Auction = {
  uuid: string;
  name: string;
  tier: string;
  item_bytes: string;
};

async function fetchAuctions(id: string, key: string): Promise<Auction[]> {
  const { body } = await request(
    `https://api.hypixel.net/skyblock/auction?key=${key}&player=${id}`,
    {
      method: 'GET',
    },
  );

  const json = await body.json();

  const auctions: Auction[] = [];
  const auctionsRaw = json.auctions as AuctionRaw[];

  Object.values(auctionsRaw).forEach(auction => {
    auctions.push({
      uuid: auction.uuid,
      name: auction.item_name,
      tier: auction.tier,
      item_bytes: auction.item_bytes.data,
    });
  });

  return auctions;
}

function main() {
  rl.question('Please, insert a player name: ', async username => {
    if (username === '') {
      console.log('Invalid name!');
      main();

      return;
    }

    const uuid = await fetchUUID(username);

    let auctions = await fetchAuctions(uuid, process.env.API_KEY);

    rl.question('Please, insert auction item name: ', name => {
      if (name === '') {
        console.log('Invalid auction name!');
        main();

        return;
      }

      auctions = auctions.filter(auction => {
        const similarity = stringSimilarity.compareTwoStrings(
          name,
          auction.name,
        );

        return similarity >= 0.6;
      });

      console.log('----------------------');
      console.log('Result:');

      Object.values(auctions).forEach(auction => {
        console.log('----------------------');
        console.log(JSON.stringify(auction));
      });
      console.log('----------------------');

      main();
    });
  });
}

main();
