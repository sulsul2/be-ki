import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDataResponse, LoginResult } from './models/auth/auth.response';
import { merekApi } from 'src/shared/axios';
import * as cheerio from 'cheerio';
import { LoginDto } from './models/auth/auth.dto';
import { AxiosRequestConfig } from 'axios';
import { SaveGeneralDto } from './models/save/save.dto';

interface RequestHeaders {
  cookie: string;
  csrfToken: string;
}

@Injectable()
export class MerekService {
  async getLoginData(): Promise<LoginDataResponse> {
    const response = await merekApi.get('/login');

    const html = response.data;
    const cookies = response.headers['set-cookie'];
    const $ = cheerio.load(html);

    const csrfToken = $('input[name="_csrf"]').val();
    const captchaKey = $('input[name="captchaKey"]').val();
    const captchaBase64 = $('img[src^="data:image/png;base64,"]').attr('src');

    if (!csrfToken || !captchaKey || !captchaBase64) {
      throw new InternalServerErrorException(
        'Could not parse required tokens from the login page.',
      );
    }

    return {
      message: 'Data fetched successfully. Please solve the CAPTCHA.',
      csrfToken,
      captchaKey,
      captchaBase64,
      cookies,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const {
      username,
      password,
      captchaAnswer,
      csrfToken,
      captchaKey,
      cookies,
    } = loginDto;

    const formdata = new FormData();
    formdata.append('username', username);
    formdata.append('password', password);
    formdata.append('captchaAnswer', captchaAnswer);
    formdata.append('captchaKey', captchaKey);
    formdata.append('_csrf', csrfToken);

    const requestConfig: AxiosRequestConfig = {
      headers: {
        Cookie: cookies.join('; '),
      },
    };

    try {
      const loginResponse = await merekApi.post(
        '/login',
        formdata,
        requestConfig,
      );

      // A 302 redirect indicates a successful login.
      if (loginResponse.status === 302) {
        return {
          status: 'OK',
          message: 'Login successful!',
          location: loginResponse.headers.location,
          sessionCookies: loginResponse.headers['set-cookie'],
        };
      }

      // A 200 status on the login POST means failure (the page re-rendered with an error).
      const $ = cheerio.load(loginResponse.data);
      const errorMessage =
        $('.alert-danger').text().trim() ||
        'Login failed. Invalid username, password, or CAPTCHA.';
      throw new UnauthorizedException(errorMessage);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Login request failed:', error.message);
      throw new InternalServerErrorException(
        'An unexpected error occurred during the login attempt.',
      );
    }
  }

  async saveOnlineForm(
    saveGeneralDto: SaveGeneralDto,
    headers: RequestHeaders,
  ): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Cookie: headers.cookie,
        'X-CSRF-TOKEN': headers.csrfToken,
      },
    };

    try {
      const response = await merekApi.post(
        '/layanan/save-online-form-1',
        saveGeneralDto,
        requestConfig,
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the form.',
      );
    }
  }

  async saveKuasaForm(
    saveKuasaDto: string,
    headers: RequestHeaders,
  ): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Cookie: headers.cookie,
        'X-CSRF-TOKEN': headers.csrfToken,
      },
    };

    try {
      const response = await merekApi.post(
        '/layanan/save-online-form-3',
        saveKuasaDto,
        requestConfig,
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the form.',
      );
    }
  }

  async listPrioritas(appNo: string, headers: RequestHeaders): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Cookie: headers.cookie,
        'X-CSRF-TOKEN': headers.csrfToken,
      },
      params: { appNo },
    };

    try {
      const response = await merekApi.get(
        '/layanan/list-prioritas',
        requestConfig,
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while getting the data.',
      );
    }
  }
}
