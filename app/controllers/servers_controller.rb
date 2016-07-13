class ServersController < ApplicationController

  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel servers_path }
  before_action :find_server_by_name, only: [:edit, :update]
  before_action :find_server_by_id,   only: [:show, :destroy]

  def index
    respond_to do |format|
      format.html { render :index }
      format.json do
        @servers = Server.select(:id, :name, :location)
        data = @servers.as_json.each do |s|
          s['DT_RowId'] = s['id']
          s['del']      = "<a href='/servers/#{s['id']}' class='text-danger' data-method='delete' rel='nofollow'
title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
          s.delete('id')
        end
        render json: { data: data }
      end
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @server.as_json(include: {
          server_type: { only: :name },
          cluster: { only: :name },
          real_server_details: {
            only: :count,
            include: { server_part: { only: :name } } },
        },
        except: [:id, :created_at, :updated_at, :server_type_id, :cluster_id])
      }
    end
  end

  def new
    respond_to do |format|
      format.html do
        @server = Server.new
        render :new
      end
      format.json do
        @server_types = ServerType.select(:id, :name)
        render json: @server_types
      end
    end
  end

  def create
    @server = Server.new(server_params)
    if @server.save
      flash[:notice] = "Данные добавлены."
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @server.errors.full_messages.join(", ") }"
      render :new
    end
  end

  def edit
    respond_to do |format|
      format.html { render :edit }
      format.json do
        server_details  = @server.real_server_details
        @server_parts   = ServerPart.select(:id, :name)
        @server_types   = ServerType.select(:id, :name)
        render json: {
          server: @server.as_json(
            include: { server_type: { only: [:id, :name] } },
            except: [:created_at, :updated_at]
          ),
          server_details: server_details.as_json(
            include: { server_part: { except: [:created_at, :updated_at] } },
            except: [:created_at, :updated_at]
          ),
          server_parts: @server_parts,
          server_types: @server_types
        }
      end
    end
  end

  def update
    if @server.update_attributes(server_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка изменения данных. #{ @server.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @server.destroy
      flash[:notice] = "Данные удалены"
    else
      flash[:alert] = "Ошибка удаления данных. #{ @server.errors.full_messages.join(", ") }"
    end
    redirect_to action: :index
  end

  private

  # Разрешение изменения strong params
  def server_params
    params.require(:server).permit(:cluster_id, :server_type_id, :name, :inventory_num, :serial_num, :location,
                                   real_server_details_attributes: [:id, :server_id, :server_part_id, :count, :_destroy])
  end

  # Поиск данных о типе запчасти по name
  def find_server_by_name
    @server = Server.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_server_by_id
    @server = Server.find(params[:id])
  end

end
