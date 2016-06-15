class ClustersController < ApplicationController
  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel clusters_path }
  before_action :find_cluster_by_name,  only: [:edit, :update]
  before_action :find_cluster_by_id,    only: [:show, :destroy]

  def index
    respond_to do |format|
      format.html { render :index }
      format.json do
        @clusters = Cluster.select(:id, :name)
        data = @clusters.as_json.each do |s|
          s['DT_RowId'] = s['id']
          s['del']      = "<a href='/clusters/#{s['id']}' class='text-danger' data-method='delete' rel='nofollow' title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
          s.delete('id')
        end
        render json: { data: data }
      end
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @cluster.as_json(include: {
        cluster_details: {
          only: [],
          include: {
            server: { only: :name },
            node_role: { only: :name } }
          }
#          include: { node_role: { only: :name } } }
        },
        except: [:id, :created_at, :updated_at] ) }
    end
  end

  def new
    respond_to do |format|
      format.html do
        @cluster = Cluster.new
        render :new
      end
      format.json do
        @servers    = Server.select(:id, :name)
        @node_roles = NodeRole.select(:id, :name)
        render json: { servers: @servers, node_roles: @node_roles }
      end
    end
  end

  def create
    @cluster = Cluster.new(cluster_params)
    if @cluster.save
      flash[:notice] = "Данные добавлены."
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка добавления данных. #{ @cluster.errors.full_messages.join(", ") }."
      render :new
    end
  end

  def edit
    respond_to do |format|
      format.html { render :edit }
      format.json do
        cluster_details = @cluster.cluster_details
        @servers        = Server.select(:id, :name)
        @node_roles     = NodeRole.select(:id, :name)
        render json: {
          cluster_details: cluster_details.as_json(include: {
            server: { only: [:id, :name] },
            node_role: { only: [:id, :name] } },
          except: [:created_at, :updated_at]),
          servers: @servers,
          node_roles: @node_roles
        }
      end
    end
  end

  def update
    if @cluster.update_attributes(cluster_params)
      flash[:notice] = "Данные изменены"
      redirect_to action: :index
    else
      flash.now[:alert] = "Ошибка изменения данных. #{ @cluster.errors.full_messages.join(", ") }"
      render :edit
    end
  end

  def destroy
    if @cluster.destroy
      flash[:notice] = "Данные удалены"
    else
      flash[:alert] = "Ошибка удаления данных. #{ @cluster.errors.full_messages.join(", ") }"
    end
    redirect_to action: :index
  end

  private

    # Разрешение изменения strong params
  def cluster_params
    params.require(:cluster).permit(:name, cluster_details_attributes: [:id, :cluster_id, :server_id, :node_role_id, :_destroy])
  end

  # Поиск данных о типе запчасти по name
  def find_cluster_by_name
    @cluster = Cluster.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_cluster_by_id
    @cluster = Cluster.find(params[:id])
  end

end
