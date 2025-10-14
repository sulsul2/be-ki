import { Body, Controller, Get, Post, Headers, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MerekService } from './merek.service';
import { LoginDataResponse, LoginResult } from './models/auth/auth.response';
import { LoginDto } from './models/auth/auth.dto';
import { DeletePriorityDto, SaveGeneralDto, SaveMerekDto, SavePemohonDto, SavePriorityDto } from './models/save/save.dto';
import { CariPermohonanDto } from './models/permohonan/permohonan.dto';
import {
  DeletePriorityResponse,
  SaveGeneralResponse,
  SaveMerekResponse,
  SavePemohonResponse,
  SavePriorityResponse,
} from './models/save/save.response';
import { PermohonanResponse } from './models/permohonan/permohonan.response';
import { FileInterceptor } from '@nestjs/platform-express';

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
  async saveGeneralForm(
    @Body() dto: SaveGeneralDto,
    @Headers('Cookie') cookie: string,
  ): Promise<SaveGeneralResponse> {
    return this.merekService.saveGeneral(dto, cookie);
  }

  @Post('/save/pemohon')
  async savePemohonForm(
    @Body() dto: SavePemohonDto,
    @Headers('Cookie') cookie: string,
  ): Promise<SavePemohonResponse> {
    return this.merekService.savePemohon(dto, cookie);
  }

  @Post('save/kuasa')
  async saveKuasaForm(
    @Headers('cookie') cookie: string,
    @Headers('x-csrf-token') csrfToken: string,
    @Body() saveKuasaDto: string,
  ): Promise<any> {
    return this.merekService.saveKuasaForm(saveKuasaDto, cookie);
  }

  @Get('/save/priority')
  async savePriorityForm(
    @Query() dto: SavePriorityDto,
    @Headers('Cookie') cookie: string,
  ): Promise<SavePriorityResponse> {
    return this.merekService.savePriority(dto, cookie);
  }

  @Get('list-prioritas')
  async listPrioritas(
    @Headers('Cookie') cookie: string,
    @Headers('X-CSRF-TOKEN') csrfToken: string,
    @Query('appNo') appNo: string,
  ): Promise<any> {
    return this.merekService.listPrioritas(appNo, cookie);
  }

  @Post('/delete/priority')
  async deletePrioritas(
    @Body() dto: DeletePriorityDto,
    @Headers('Cookie') cookie: string,
  ): Promise<DeletePriorityResponse> {
    return this.merekService.deletePrioritas(dto, cookie);
  }

  @Post('/save/merek')
  @UseInterceptors(FileInterceptor('fileMerek'))
  async saveMerek(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SaveMerekDto,
    @Headers('Cookie') cookie: string,
  ): Promise<SaveMerekResponse> {
    return this.merekService.saveMerek(dto, file, cookie);
  }

  @Get('permohonan')
  async listPermohonan(
    @Headers('Cookie') cookie: string,
    @Body() body: CariPermohonanDto,
  ): Promise<PermohonanResponse> {
    return this.merekService.listPermohonan(body, cookie);
  }
}
