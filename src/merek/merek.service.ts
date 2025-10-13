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
import { CariPermohonanDto } from './models/permohonan/permohonan.dto';
import { PermohonanResponse } from './models/permohonan/permohonan.view';

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
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
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
      throw new InternalServerErrorException(
        'An unexpected error occurred during the login attempt.',
      );
    }
  }

  async saveOnlineForm(
    saveGeneralDto: SaveGeneralDto,
    cookie: string,
  ): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Cookie: cookie,
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
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the form.',
      );
    }
  }

  async saveKuasaForm(saveKuasaDto: string, cookie: string): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Cookie: cookie,
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
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the form.',
      );
    }
  }

  async listPrioritas(appNo: string, cookie: string): Promise<any> {
    try {
      const initialResponse = await merekApi.get('/layanan/home', {
        headers: {
          Cookie: cookie,
        },
        params: { no: appNo },
      });
      const html = initialResponse.data;

      const csrfRegex = /var csrf = '([^']+)';/;
      const match = html.match(csrfRegex);

      if (!match || !match[1]) {
        throw new UnauthorizedException('Could not find CSRF token.');
      }

      const csrfToken = match[1];

      const requestConfig: AxiosRequestConfig = {
        headers: {
          Cookie: cookie,
          'X-CSRF-TOKEN': csrfToken,
          Referer: `https://merek.dgip.go.id/layanan/edit-permohonan-online?no=${appNo}`,
        },
        params: { appNo, _: Date.now() },
      };
      const response = await merekApi.get(
        '/layanan/list-prioritas',
        requestConfig,
      );
      if (response.status === 302) {
        throw new UnauthorizedException('Session expired. Please login again.');
      }
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        'An unexpected error occurred while getting the data.',
      );
    }
  }

  async listPermohonan(
    params: CariPermohonanDto,
    cookie: string,
  ): Promise<PermohonanResponse> {
    try {
      const listPageResponse = await merekApi.get(
        '/layanan/list-data-permohonan-online',
        {
          headers: {
            Cookie: cookie,
          },
        },
      );

      const html = listPageResponse.data;
      const csrfMatch = html.match(/var csrf = '([^']+)';/);
      if (!csrfMatch || !csrfMatch[1]) {
        throw new InternalServerErrorException(
          'Could not extract CSRF token from the application list page.',
        );
      }
      const pageCsrfToken = csrfMatch[1];

      const pageNum = params.page || 1;
      const limitNum = params.limit || 10;
      const start = (pageNum - 1) * limitNum;

      const SEARCH_FIELDS = [
        'txReception.applicationDate',
        'applicationNoOnline',
        'txReception.eFilingNo',
        'txTmBrand.name',
        'txReception.mFileTypeDetail.id',
        'classList',
        'txReception.bankCode',
      ];

      const searchParams = {
        'txReception.applicationDate': params.search?.applicationDate,
        applicationNoOnline: params.search?.applicationNoOnline,
        'txReception.eFilingNo': params.search?.eFilingNo,
        'txTmBrand.name': params.search?.brandName,
        'txReception.mFileTypeDetail.id': params.search?.fileTypeDetailId,
        classList: params.search?.classList,
        'txReception.bankCode': params.search?.bankCode,
      };

      const keywordArr = SEARCH_FIELDS.map(
        (field) => searchParams[field] || '',
      );

      const payload = new URLSearchParams();
      payload.append('draw', String(pageNum));
      payload.append('start', String(start));
      payload.append('length', String(limitNum));
      payload.append('_csrf', pageCsrfToken);
      payload.append('orderBy', 'txReception.applicationDate');
      payload.append('orderType', 'DESC');
      payload.append('search[value]', '');
      payload.append('search[regex]', 'false');
      payload.append('order[0][column]', '2');
      payload.append('order[0][dir]', 'desc');
      SEARCH_FIELDS.forEach((field) => {
        payload.append('searchByArr[]', field);
      });
      keywordArr.forEach((keyword) => {
        payload.append('keywordArr[]', keyword);
      });

      const dataResponse = await merekApi.post(
        '/layanan/cari-permohonan-online',
        payload.toString(),
        {
          headers: {
            Cookie: cookie,
            'X-CSRF-TOKEN': pageCsrfToken,
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
      );

      const rawData = dataResponse.data.data;
      const formattedData = rawData.map((item: string[]) => {
        const actionHTML = cheerio.load(item[12]);
        const action = actionHTML('a').text();

        const nomorTransaksiHTML = cheerio.load(item[1]);
        const nomorTransaksi = nomorTransaksiHTML.text();

        return {
          no: item[0],
          nomor_transaksi: nomorTransaksi,
          tanggal_pengajuan: item[2],
          tipe_merek: item[3],
          merek: item[4],
          kelas: item[5],
          nomor_permohonan: item[6],
          tipe_permohonan: item[7],
          jenis_permohonan: item[8],
          status: item[9],
          kode_billing: item[10],
          status_pembayaran: item[11],
          actions: action,
        };
      });

      return {
        draw: dataResponse.data.draw,
        recordsTotal: dataResponse.data.recordsTotal,
        recordsFiltered: dataResponse.data.recordsFiltered,
        data: formattedData,
        status: 'OK',
        message: 'Get permohonan list successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch permohonan list.',
      );
    }
  }
}
