import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  captchaAnswer: string;

  @IsString()
  @IsNotEmpty()
  csrfToken: string;

  @IsString()
  @IsNotEmpty()
  captchaKey: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cookies: string[];
}
