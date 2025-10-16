import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDataResponse, LoginResult } from './models/auth/auth.response';
import { merekApi } from 'src/shared/axios';
import * as cheerio from 'cheerio';
import { LoginDto } from './models/auth/auth.dto';
import { AxiosRequestConfig } from 'axios';
import { ApplicantSearchDto } from './models/permohonan/permohonan.dto';
import { PermohonanResponse } from './models/permohonan/permohonan.response';
import {
  DeletePriorityDto,
  SaveGeneralDto,
  SaveMerekDto,
  SaveApplicantDto,
  SavePriorityDto,
} from './models/save/save.dto';
import {
  DeletePriorityResponse,
  SaveGeneralResponse,
  SaveMerekResponse,
  SaveApplicantResponse,
  SavePriorityResponse,
} from './models/save/save.response';
import { extractTextFromImage } from 'src/shared/openai';

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
    try {
      const loadLoginPage = await merekApi.get('/login');

      const cookies = loadLoginPage.headers['set-cookie'];
      const pageHTML = cheerio.load(loadLoginPage.data);

      const csrfToken = pageHTML('input[name="_csrf"]').val();
      const captchaKey = pageHTML('input[name="captchaKey"]').val();
      const captchaBase64 = pageHTML('img[src^="data:image/png;base64,"]').attr(
        'src',
      );

      const captchaAnswer = await extractTextFromImage(captchaBase64 || '');

      const formdata = new FormData();
      formdata.append('username', loginDto.username);
      formdata.append('password', loginDto.password);
      formdata.append('captchaAnswer', captchaAnswer);
      formdata.append('captchaKey', captchaKey);
      formdata.append('_csrf', csrfToken);

      const requestConfig: AxiosRequestConfig = {
        headers: {
          Cookie: cookies ? cookies.join('; ') : '',
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      };
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
          data: {
            location: loginResponse.headers.location,
            sessionCookies: loginResponse.headers['set-cookie'],
          },
        };
      }

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

  async saveGeneral(
    dto: SaveGeneralDto,
    cookie: string,
  ): Promise<SaveGeneralResponse> {
    try {
      const listPageResponse = await merekApi.get(
        '/layanan/tambah-permohonan-online?billingCode=false',
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

      const payload = {
        appid: '',
        law: '7',
        bankCode: '',
        applicationDate: dto.tanggalPengajuan,
        paymentDate: '',
        mFileSequence: {
          id: dto.asalPermohonan,
        },
        mFileType: {
          id: dto.tipePermohonan,
        },
        mFileTypeDetail: {
          id: dto.jenisPermohonan,
        },
        totalClass: '0',
        totalPayment: '',
      };

      const saveResponse = await merekApi.post(
        '/layanan/save-online-form-1?pnbp=true',
        payload,
        {
          headers: {
            Cookie: cookie,
            'X-CSRF-TOKEN': pageCsrfToken,
          },
        },
      );

      return {
        data: { applicationNo: saveResponse.data },
        status: 'OK',
        message: 'Form saved successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the form.',
      );
    }
  }

  async listApplicant(
    params: ApplicantSearchDto,
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

  async saveApplicant(
    dto: SaveApplicantDto,
    cookie: string,
  ): Promise<SaveApplicantResponse> {
    try {
      const listPageResponse = await merekApi.get(
        '/layanan/tambah-permohonan-online?billingCode=false',
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

      const payload = {
        id: dto.id,
        txTmGeneral: { applicationNo: dto.applicationNo },
        name: dto.name,
        no: dto.noKtp || null,
        nationality: { id: dto.nationalityId },
        ownerType: dto.ownerType,
        mCountry: { id: dto.countryId },
        mProvince: { id: dto.provinceId },
        mCity: { id: dto.cityId },
        address: dto.address,
        zipCode: dto.zipCode || null,
        phone: dto.phone,
        email: dto.email,
        whatsapp: dto.whatsapp || null,
        addressFlag: dto.addressFlag,
        postCountry: { id: dto.postCountryId },
        postProvince: { id: dto.postProvinceId },
        postCity: { id: dto.postCityId },
        postAddress: dto.postAddress,
        postZipCode: dto.postZipCode,
        postPhone: dto.postPhone,
        postEmail: dto.postEmail,
        txTmOwnerDetails: dto.additionalOwners || [],
      };

      await merekApi.post('/layanan/save-online-form-2', payload, {
        headers: {
          Cookie: cookie,
          'X-CSRF-TOKEN': pageCsrfToken,
        },
      });
      return {
        status: 'OK',
        message: 'Form saved successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the form.',
      );
    }
  }

  // save kuasa
  async saveRepresentativeForm(
    saveRepresentativeDto: string,
    cookie: string,
  ): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Cookie: cookie,
      },
    };

    try {
      const response = await merekApi.post(
        '/layanan/save-online-form-3',
        saveRepresentativeDto,
        requestConfig,
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the form.',
      );
    }
  }

  async listPriority(appNo: string, cookie: string): Promise<any> {
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

  async savePriority(
    dto: SavePriorityDto,
    cookie: string,
  ): Promise<SavePriorityResponse> {
    try {
      const editPageResponse = await merekApi.get(
        `/layanan/edit-permohonan-online?no=${dto.appNo}`,
        {
          headers: {
            Cookie: cookie,
          },
        },
      );

      const html = editPageResponse.data;
      const csrfMatch = html.match(/var csrf = '([^']+)';/);
      if (!csrfMatch || !csrfMatch[1]) {
        throw new InternalServerErrorException(
          'Could not extract CSRF token from the edit application page.',
        );
      }
      const pageCsrfToken = csrfMatch[1];

      const saveResponse = await merekApi.get('/layanan/save-online-form-4', {
        params: {
          tgl: dto.date,
          negara: dto.country,
          negaraId: dto.countryId,
          no: dto.no,
          appNo: dto.appNo,
        },
        headers: {
          Cookie: cookie,
          'X-CSRF-TOKEN': pageCsrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `https://merek.dgip.go.id/layanan/edit-permohonan-online?no=${dto.appNo}`,
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      if (saveResponse.status === 302) {
        throw new UnauthorizedException('Session expired. Please login again.');
      }

      return {
        status: 'OK',
        message: 'Priority form saved successfully.',
        data: saveResponse.data,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error(error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the priority form.',
      );
    }
  }

  async deletePriority(
    dto: DeletePriorityDto,
    cookie: string,
  ): Promise<DeletePriorityResponse> {
    try {
      const editPageResponse = await merekApi.get(
        `/layanan/edit-permohonan-online?no=${dto.appNo}`,
        {
          headers: {
            Cookie: cookie,
          },
        },
      );

      const html = editPageResponse.data;
      const csrfMatch = html.match(/var csrf = '([^']+)';/);
      if (!csrfMatch || !csrfMatch[1]) {
        throw new InternalServerErrorException(
          'Could not extract CSRF token from the edit application page for deletion.',
        );
      }
      const pageCsrfToken = csrfMatch[1];

      const payload = new URLSearchParams();
      payload.append('idPrior', dto.priorId);

      const deleteResponse = await merekApi.post(
        '/layanan/delete-online-form-4',
        payload.toString(),
        {
          headers: {
            Cookie: cookie,
            'X-CSRF-TOKEN': pageCsrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Referer: `https://merek.dgip.go.id/layanan/edit-permohonan-online?no=${dto.appNo}`,
          },
        },
      );

      if (deleteResponse.status === 200) {
        return {
          status: 'OK',
          message: 'Priority record deleted successfully.',
        };
      } else {
        // Handle unexpected success statuses if necessary
        throw new InternalServerErrorException(
          'Received an unexpected response from the server.',
        );
      }
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while deleting the priority record.',
      );
    }
  }

  async saveMerek(
    dto: SaveMerekDto,
    file: Express.Multer.File,
    cookie: string,
  ): Promise<SaveMerekResponse> {
    try {
      const editPageResponse = await merekApi.get(
        `/layanan/edit-permohonan-online?no=${dto.appNo}`,
        {
          headers: {
            Cookie: cookie,
          },
        },
      );

      const html = editPageResponse.data;
      const csrfMatch = html.match(/var csrf = '([^']+)';/);
      if (!csrfMatch || !csrfMatch[1]) {
        throw new InternalServerErrorException(
          'Could not extract CSRF token from the edit application page.',
        );
      }
      const pageCsrfToken = csrfMatch[1];

      const formData = new FormData();
      formData.append('fileMerek', file.buffer, file.originalname);
      formData.append('listImageDetail', dto.listImageDetail);
      formData.append('listDelete', dto.listDelete);
      formData.append('agreeDisclaimer', dto.agreeDisclaimer);
      formData.append('txTmBrand', dto.txTmBrand);

      const saveResponse = await merekApi.post(
        '/layanan/save-online-form-5',
        formData,
        {
          headers: {
            Cookie: cookie,
            'X-CSRF-TOKEN': pageCsrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            Referer: `https://merek.dgip.go.id/layanan/edit-permohonan-online?no=${dto.appNo}`,
          },
        },
      );

      return {
        status: 'OK',
        message: 'Brand form saved successfully.',
        data: saveResponse.data,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while saving the brand form.',
      );
    }
  }
}
