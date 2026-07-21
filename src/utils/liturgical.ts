import { EventItem } from "../types";

// Helper: Get Easter date for any year using Anonymous Gregorian Algorithm
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

// Helper: Get the First Sunday of Advent (closest Sunday to November 30)
export function getFirstSundayOfAdvent(year: number): Date {
  // Start on Nov 30
  const d = new Date(Date.UTC(year, 10, 30));
  const day = d.getUTCDay();
  // Adjust to closest Sunday
  const diff = day <= 3 ? -day : 7 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

// Helper: Get the Sunday after Christmas (Holy Family)
export function getHolyFamilyDate(year: number): Date {
  const christmas = new Date(Date.UTC(year, 11, 25));
  const day = christmas.getUTCDay();
  if (day === 0) {
    // If Christmas is Sunday, Holy Family is Dec 30
    return new Date(Date.UTC(year, 11, 30));
  }
  // Otherwise, find the next Sunday after Christmas
  const diff = 7 - day;
  return new Date(Date.UTC(year, 11, 25 + diff));
}

// Helper: Get Epiphany (First Sunday after January 1)
export function getEpiphanyDate(year: number): Date {
  const jan2 = new Date(Date.UTC(year, 0, 2));
  const day = jan2.getUTCDay();
  if (day === 0) return jan2;
  const diff = 7 - day;
  return new Date(Date.UTC(year, 0, 2 + diff));
}

// Format Date as YYYY-MM-DD
export function formatDateStr(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Generate the major USCCB Liturgical Year Solemnities & Feasts
export function getLiturgicalEvents(year: number): EventItem[] {
  const easter = getEasterDate(year);
  
  const addDays = (base: Date, days: number): Date => {
    const res = new Date(base.getTime());
    res.setUTCDate(res.getUTCDate() + days);
    return res;
  };

  const rawEvents = [
    {
      name: "Solemnity of Mary, Mother of God",
      date: new Date(Date.UTC(year, 0, 1)),
      description: "A holy day of obligation celebrating Mary's motherhood of Jesus.",
      time: "9:00 AM & 11:00 AM",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of the Epiphany of the Lord",
      date: getEpiphanyDate(year),
      description: "Celebrating the manifestation of Christ to the Gentiles, represented by the Magi.",
      time: "10:30 AM",
      location: "Main Sanctuary"
    },
    {
      name: "Feast of the Baptism of the Lord",
      date: addDays(getEpiphanyDate(year), 7),
      description: "Commemorating the Baptism of Jesus in the Jordan, marking the beginning of His public ministry.",
      time: "8:00 AM & 10:30 AM",
      location: "Main Sanctuary"
    },
    {
      name: "Ash Wednesday",
      date: addDays(easter, -46),
      description: "A day of fast and abstinence marking the beginning of the Season of Lent.",
      time: "7:00 AM, 12:00 PM, & 7:00 PM",
      location: "Church Sanctuary"
    },
    {
      name: "Palm Sunday of the Passion of the Lord",
      date: addDays(easter, -7),
      description: "Commemorating Jesus' triumphal entry into Jerusalem and the reading of the Passion.",
      time: "10:30 AM Mass (Procession starts at 10:15 AM)",
      location: "Parish Plaza & Church"
    },
    {
      name: "Holy Thursday: Mass of the Lord's Supper",
      date: addDays(easter, -3),
      description: "Beginning the Sacred Paschal Triduum, commemorating the washing of feet and institution of the Eucharist.",
      time: "7:30 PM - 9:00 PM",
      location: "Church Sanctuary"
    },
    {
      name: "Good Friday of the Passion of the Lord",
      date: addDays(easter, -2),
      description: "Solemn liturgy of the Lord's Passion, Adoration of the Holy Cross, and Holy Communion.",
      time: "3:00 PM & 7:00 PM",
      location: "Church Sanctuary"
    },
    {
      name: "Holy Saturday: The Easter Vigil in the Holy Night",
      date: addDays(easter, -1),
      description: "The peak liturgical night of the year! Our OCIA Elect receive the Sacraments of Initiation.",
      time: "8:00 PM - 11:00 PM",
      location: "Church Sanctuary & Fire Pit"
    },
    {
      name: "Easter Sunday: Solemnity of the Resurrection",
      date: easter,
      description: "He is Risen! Celebrating the triumph of Christ over sin and death.",
      time: "8:00 AM, 10:00 AM, & 12:00 PM",
      location: "Main Sanctuary"
    },
    {
      name: "Divine Mercy Sunday",
      date: addDays(easter, 7),
      description: "The Second Sunday of Easter, focusing on God's infinite merciful love.",
      time: "10:30 AM Mass with Divine Mercy Chaplet at 3:00 PM",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of the Ascension of the Lord",
      date: addDays(easter, 42), // Celebrated on Sunday in USCCB
      description: "Celebrating Jesus' return to His Heavenly Father 40 days after the Resurrection.",
      time: "10:30 AM",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of Pentecost",
      date: addDays(easter, 49),
      description: "The birthday of the Church! Commemorating the descent of the Holy Spirit upon the Apostles.",
      time: "10:30 AM Mass (Wear Red!)",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of the Most Holy Trinity",
      date: addDays(easter, 56),
      description: "Celebrating the mystery of one God in three divine Persons: Father, Son, and Holy Spirit.",
      time: "10:30 AM",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of the Most Holy Body and Blood of Christ (Corpus Christi)",
      date: addDays(easter, 63),
      description: "Honoring the Real Presence of Jesus in the Eucharist with a solemn parish Eucharistic Procession.",
      time: "10:30 AM Mass followed by outdoor procession",
      location: "Main Sanctuary & Parish Grounds"
    },
    {
      name: "Solemnity of the Assumption of the Blessed Virgin Mary",
      date: new Date(Date.UTC(year, 7, 15)),
      description: "Celebrating Mary being taken body and soul into heavenly glory.",
      time: "9:00 AM & 7:00 PM",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of All Saints",
      date: new Date(Date.UTC(year, 10, 1)),
      description: "Honoring all the saints in heaven, known and unknown, who inspire our faith.",
      time: "9:00 AM & 7:00 PM",
      location: "Main Sanctuary"
    },
    {
      name: "Commemoration of All the Faithful Departed (All Souls' Day)",
      date: new Date(Date.UTC(year, 10, 2)),
      description: "Praying for our beloved dead, especially those in purgatory.",
      time: "12:00 PM & 7:00 PM",
      location: "Parish Cemetery & Church"
    },
    {
      name: "Solemnity of Our Lord Jesus Christ, King of the Universe",
      date: addDays(getFirstSundayOfAdvent(year), -7),
      description: "The final Sunday of the liturgical year, celebrating Christ's cosmic reign.",
      time: "10:30 AM",
      location: "Main Sanctuary"
    },
    {
      name: "First Sunday of Advent",
      date: getFirstSundayOfAdvent(year),
      description: "Beginning a new liturgical year and a season of hopeful preparation for Christ's coming.",
      time: "8:00 AM, 10:30 AM, & 5:00 PM",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of the Immaculate Conception of the Blessed Virgin Mary",
      date: new Date(Date.UTC(year, 11, 8)),
      description: "Celebrating Mary being preserved free from all stain of original sin from her conception.",
      time: "9:00 AM & 7:00 PM",
      location: "Main Sanctuary"
    },
    {
      name: "Solemnity of the Nativity of the Lord (Christmas Eve & Day)",
      date: new Date(Date.UTC(year, 11, 25)),
      description: "Glory to God in the highest! Celebrating the Birth of our Savior, Jesus Christ.",
      time: "Midnight Mass (12:00 AM), 9:00 AM & 11:00 AM",
      location: "Main Sanctuary"
    },
    {
      name: "Feast of the Holy Family of Jesus, Mary, and Joseph",
      date: getHolyFamilyDate(year),
      description: "Honoring the Holy Family as the model and patron of all Christian families.",
      time: "10:30 AM",
      location: "Main Sanctuary"
    }
  ];

  return rawEvents.map((e, index) => ({
    id: `lit-${year}-${index}`,
    title: e.name,
    description: e.description,
    date: formatDateStr(e.date),
    time: e.time,
    location: e.location,
    type: "liturgy",
    attendees: []
  }));
}

// Compute Liturgical season fallback dynamically
export function getLiturgicalDayFallback(date: Date): { 
  season: "lent" | "ordinary" | "easter" | "pentecost"; 
  seasonName: string;
  seasonWeek: number; 
  title: string; 
  colour: string; 
} {
  const y = date.getUTCFullYear();
  const time = date.getTime();

  const addDays = (base: Date, days: number): Date => {
    const res = new Date(base.getTime());
    res.setUTCDate(res.getUTCDate() + days);
    return res;
  };

  const easter = getEasterDate(y);
  const ashWednesday = addDays(easter, -46);
  const pentecost = addDays(easter, 49);
  const advent1 = getFirstSundayOfAdvent(y);
  const christmas = new Date(Date.UTC(y, 11, 25));

  // Previous year landmarks for January
  const epiphanyPrev = getEpiphanyDate(y);
  const baptismOfLordPrev = addDays(epiphanyPrev, 7);

  // Determine season
  if (time < baptismOfLordPrev.getTime()) {
    // Christmastide
    const week = Math.floor((time - new Date(Date.UTC(y - 1, 11, 25)).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      season: "easter",
      seasonName: "Christmas Season",
      seasonWeek: Math.max(1, week),
      title: "Christmas Octave & Epiphany season",
      colour: "white"
    };
  } else if (time < ashWednesday.getTime()) {
    // Ordinary Time Part 1
    const week = Math.floor((time - baptismOfLordPrev.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      season: "ordinary",
      seasonName: "Ordinary Time",
      seasonWeek: Math.max(1, week),
      title: `Week ${Math.max(1, week)} in Ordinary Time`,
      colour: "green"
    };
  } else if (time < easter.getTime()) {
    // Lent
    const week = Math.floor((time - ashWednesday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      season: "lent",
      seasonName: "Lent",
      seasonWeek: Math.max(1, week),
      title: `Week ${Math.max(1, week)} of Lent`,
      colour: "violet"
    };
  } else if (time <= pentecost.getTime()) {
    // Eastertide
    const isPentecost = Math.abs(time - pentecost.getTime()) < 24 * 60 * 60 * 1000;
    const week = Math.floor((time - easter.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      season: isPentecost ? "pentecost" : "easter",
      seasonName: isPentecost ? "Pentecost" : "Eastertide",
      seasonWeek: Math.max(1, week),
      title: isPentecost ? "Solemnity of Pentecost Sunday" : `Week ${Math.max(1, week)} of Easter`,
      colour: isPentecost ? "red" : "white"
    };
  } else if (time < advent1.getTime()) {
    // Ordinary Time Part 2
    const totalDaysToAdvent = Math.floor((advent1.getTime() - time) / (24 * 60 * 60 * 1000));
    const weekFromEnd = Math.floor(totalDaysToAdvent / 7);
    const weekOfOrdinary = Math.max(1, 34 - weekFromEnd);
    return {
      season: "ordinary",
      seasonName: "Ordinary Time",
      seasonWeek: weekOfOrdinary,
      title: `Week ${weekOfOrdinary} in Ordinary Time`,
      colour: "green"
    };
  } else if (time < christmas.getTime()) {
    // Advent
    const week = Math.floor((time - advent1.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return {
      season: "lent", // Use purple theme
      seasonName: "Advent",
      seasonWeek: Math.max(1, week),
      title: `Week ${Math.max(1, week)} of Advent`,
      colour: "violet"
    };
  } else {
    // Christmas Season current year
    return {
      season: "easter", // Use white theme
      seasonName: "Christmas Season",
      seasonWeek: 1,
      title: "The Solemnity of the Nativity of the Lord (Christmas)",
      colour: "white"
    };
  }
}
