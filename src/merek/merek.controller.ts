import { Body, Controller, Get, Post, Headers, Query } from '@nestjs/common';
import { MerekService } from './merek.service';
import { LoginDataResponse, LoginResult } from './models/auth/auth.response';
import { LoginDto } from './models/auth/auth.dto';
import { SaveGeneralDto } from './models/save/save.dto';
import { CariPermohonanDto } from './models/permohonan/permohonan.dto';
import { SaveGeneralResponse } from './models/save/save.response';
import { PermohonanResponse } from './models/permohonan/permohonan.response';

@Controller()
export class MerekController {
  constructor(private readonly merekService: MerekService) {}

  @Get('/auth/login-data')
  async getLoginData(): Promise<LoginDataResponse> {
    return this.merekService.getLoginData();
  }

  @Post('/auth/login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResult> {
    return this.merekService.login(loginDto);
  }

  @Post('/save/general')
  async savePermohonanGeneral(
    @Body() dto: SaveGeneralDto,
    @Headers('Cookie') cookie: string,
  ): Promise<SaveGeneralResponse> {
    return this.merekService.saveGeneral(dto, cookie);
  }

  @Post('save/kuasa')
  async saveKuasaForm(
    @Headers('cookie') cookie: string,
    @Headers('x-csrf-token') csrfToken: string,
    @Body() saveKuasaDto: string,
  ): Promise<any> {
    return this.merekService.saveKuasaForm(saveKuasaDto, cookie);
  }

  @Get('list-prioritas')
  async listPrioritas(
    @Headers('Cookie') cookie: string,
    @Headers('X-CSRF-TOKEN') csrfToken: string,
    @Query('appNo') appNo: string,
  ): Promise<any> {
    return this.merekService.listPrioritas(appNo, cookie);
  }

  @Get('permohonan')
  async listPermohonan(
    @Headers('Cookie') cookie: string,
    @Body() body: CariPermohonanDto,
  ): Promise<PermohonanResponse> {
    return this.merekService.listPermohonan(body, cookie);
  }
}
