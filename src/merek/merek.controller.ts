import { Body, Controller, Get, Post, Headers, Param } from '@nestjs/common';
import { MerekService } from './merek.service';
import { LoginDataResponse, LoginResult } from './models/auth/auth.response';
import { LoginDto } from './models/auth/auth.dto';
import { SaveGeneralDto } from './models/save/save.dto';

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

  @Post('save/general')
  async saveGeneralForm(
    @Headers('cookie') cookie: string,
    @Headers('x-csrf-token') csrfToken: string,
    @Body() saveGeneralDto: SaveGeneralDto,
  ): Promise<any> {
    return this.merekService.saveOnlineForm(saveGeneralDto, {
      cookie,
      csrfToken,
    });
  }

  @Post('save/kuasa')
  async saveKuasaForm(
    @Headers('cookie') cookie: string,
    @Headers('x-csrf-token') csrfToken: string,
    @Body() saveKuasaDto: string,
  ): Promise<any> {
    return this.merekService.saveKuasaForm(saveKuasaDto, {
      cookie,
      csrfToken,
    });
  }

  @Get('list-prioritas')
  async listPrioritas(
    @Headers('cookie') cookie: string,
    @Headers('x-csrf-token') csrfToken: string,
    @Param('appNo') appNo: string,
  ): Promise<any> {
    return this.merekService.listPrioritas(appNo, { cookie, csrfToken });
  }
}
