import {
  Update,
  Start,
  Ctx,
  On,
  Hears,
  Command,
  Action,
} from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';
import { API_KEY, BOT_NAME } from '../app.constants';
import axios from 'axios';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    return this.botService.start(ctx);
  }

  @Command('stop')
  async onStop(@Ctx() ctx: Context) {
    return this.botService.onStop(ctx);
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    return this.botService.onContact(ctx);
  }

  @Command('info')
  async onInfoCommand(ctx: Context) {
    const botInfo = this.getBotInfo();
    await ctx.reply(botInfo);
  }

  getBotInfo(): string {
    const botName = BOT_NAME;
    const description = `A weather bot that provides weather information.`;
    const contact =
      '\n\n       📩email: someone@gmail.com\
       \n\n       📞phone number: +998-99-999-99-99';

    return `🤖Bot Name: ${botName}\n\n📋Description: ${description}\n\n👤Author contact info: ${contact}`;
  }

  @Command('location')
  async onWeatherCommand(ctx: Context) {
    await ctx.reply('📍Please enter the location name:');
  }

  @On('text')
  async onText(ctx: Context) {
    const message = ctx.message;

    if (message) {
      if ('text' in message) {
        const city = message.text;

        try {
          const weatherData = await this.fetchWeatherData(city);

          if (weatherData) {
            const weatherMessage = this.createWeatherMessage(weatherData);
            await ctx.reply(weatherMessage);
          } else {
            await ctx.reply('Sorry, could not fetch weather data.');
          }
        } catch (error) {
          console.error('Error processing weather data:', error);
          await ctx.reply('An error occurred while processing weather data.');
        }
      }
    }
  }

  private async fetchWeatherData(city: string) {
    try {
      const API = API_KEY;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API}&units=metric`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  private createWeatherMessage(weatherData: any) {
    console.log(weatherData);
    const temperature = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;
    const weatherDescription = weatherData.weather[0].description;
    const sunriseTime = new Date(
      weatherData.sys.sunrise * 1000,
    ).toLocaleTimeString();
    const sunsetTime = new Date(
      weatherData.sys.sunset * 1000,
    ).toLocaleTimeString();
    const visibility = weatherData.visibility;

    return `
    Weather in ${weatherData.name}:

      🌡️ Temperature: ${temperature}°C

      💧 Humidity: ${humidity}%

      💨 Wind speed: ${windSpeed} km/h

      ☁️ Weather: ${weatherDescription}

      👁️ Visibility: ${visibility} km

      🌅 Sunrise: ${sunriseTime}

      🌆 Sunset: ${sunsetTime}
  `;
  }
}
