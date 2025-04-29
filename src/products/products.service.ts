import { HttpStatus, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit{
  private readonly logger = new Logger('ProductService')
  onModuleInit() {
    this.$connect();
    this.logger.log('Base de datos conectada Productos')
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    });
  }

  async findAll( paginationDto: PaginationDto) {

    const {page = 1,limit=50} = paginationDto;
    const totalPage= await this.product.count({where: {active: true}});
    const lastPage = Math.ceil( totalPage / limit);
    return {
      data: await this.product.findMany({
        skip: ( page -1 ) * limit,
        take: limit,
        where: {active: true}
        
      }),
      meta: {
        Page : page,
        Total: totalPage,
        LastPage: lastPage,
      }
    }
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where:{id, active: true}
    });

    if (!product){
      throw new RpcException({
        message: `producto con el id #${id} no encontrado`,
        status: HttpStatus.BAD_REQUEST
      })
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id:__ , ...data} = updateProductDto;
    await this.findOne(id);
    return this.product.update({
      where:{id},
      data: data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // return this.product.delete({
    //   where:{id}
    // });

    const product = await this.product.update({
      where: {id},
      data: {
        active: false
      }
    });
    return product;
  }


  async validateProducts (ids: number[]){
    ids = Array.from(new Set(ids));
    const products = await this.product.findMany({
      where: {
        id: {
          in:ids
        }
      }   
     });
    
    if (products.length !== ids.length){
      throw new RpcException({
        message: 'some products were not found',
        status: HttpStatus.BAD_REQUEST
      });
    } 
    return products;
  }
}
