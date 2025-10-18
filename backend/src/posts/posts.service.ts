import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) { }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const newPost = new this.postModel(createPostDto);
    return newPost.save();
  }

  // async findAll(): Promise<Post[]> {
  //   return this.postModel
  //     .find()
  //     .sort({ createdAt: -1 })
  //     .exec();
  // }

  // findAll 메서드를 페이지네이션과 검색을 지원하도록 수정
  // 이것이 페이지네이션을 지원하는 새로운 버전입니다
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const searchFilter = search
      ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ],
      }
      : {};

    const posts = await this.postModel
      .find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.postModel.countDocuments(searchFilter).exec();

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }


  async findOne(id: string): Promise<Post> {
    const post = await this.postModel
      .findById(id)
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async incrementViews(id: string): Promise<Post> {
    const post = await this.postModel
      .findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true },
      )
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();

    if (!updatedPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    const result = await this.postModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }
}