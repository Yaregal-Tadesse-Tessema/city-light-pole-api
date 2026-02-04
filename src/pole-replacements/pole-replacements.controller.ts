import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PoleReplacementsService } from './pole-replacements.service';
import { CreatePoleReplacementDto } from './dto/create-pole-replacement.dto';

@Controller('pole-replacements')
export class PoleReplacementsController {
  constructor(private readonly poleReplacementsService: PoleReplacementsService) {}

  @Post()
  create(@Body() createPoleReplacementDto: CreatePoleReplacementDto) {
    return this.poleReplacementsService.create(createPoleReplacementDto);
  }

  @Get()
  findAll() {
    return this.poleReplacementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.poleReplacementsService.findOne(id);
  }
}
