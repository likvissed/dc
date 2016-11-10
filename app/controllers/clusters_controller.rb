class ClustersController < ApplicationController
  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel clusters_path }
  before_action :find_cluster_by_name,  only: [:edit]
  before_action :find_cluster_by_id,    only: [:show, :update, :destroy]

  def index
    respond_to do |format|
      format.html
      format.json { render json: Cluster.select(:id, :name) }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: @cluster.as_json(
        include: {
          cluster_details: {
            only: [],
            include: {
              server: { only: :name },
              node_role: { only: :name } }
            }
          },
        except: [:id, :created_at, :updated_at]
      ) }
    end
  end

  def new
    respond_to do |format|
      format.json do
        if Server.exists? && NodeRole.exists?
          @servers    = Server.select(:id, :name)
          @node_roles = NodeRole.select(:id, :name)

          render json: { servers: @servers, node_roles: @node_roles }, status: :ok
        else
          render json: { full_message: "Перед созданием сервера необходимо создать \"Оборудование\" и \"Типы серверов\"" }, status: :unprocessable_entity
        end
      end
    end
  end

  def create
    @cluster = Cluster.new(cluster_params)
    if @cluster.save
      respond_to do |format|
        format.json { render json: { full_message: "Сервер добавлен" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @cluster.errors, full_message: "Ошибка. #{ @cluster.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def edit
    respond_to do |format|
      format.html { render :edit }
      format.json do
        @servers    = Server.select(:id, :name)
        @node_roles = NodeRole.select(:id, :name)
        render json: {
          data: @cluster.as_json(include: {
            cluster_details: {
              except: [:created_at, :updated_at]
            } },
          except: [:created_at, :updated_at]),
          servers: @servers,
          node_roles: @node_roles
        }
      end
    end
  end

  def update
    if @cluster.update_attributes(cluster_params)
      respond_to do |format|
        format.json { render json: { full_message: "Сервер изменен" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { object: @cluster.errors, full_message: "Ошибка. #{ @cluster.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    if @cluster.destroy
      respond_to do |format|
        format.json { render json: { full_message: "Сервер удален" }, status: :ok }
      end
    else
      respond_to do |format|
        format.json { render json: { full_message: "Ошибка. #{ @cluster.errors.full_messages.join(", ") }" }, status: :unprocessable_entity }
      end
    end
  end

  # Если у пользователя есть доступ, в ответ присылается html-код кнопки "Добавить" для создания новой записи
  # Запрос отсылается из JS файла при инициализации таблицы "Серверы"
  def link_to_new_record
    link = create_link_to_new_record :modal, Cluster, "ng-click='clusterPage.showClusterModal()"
    respond_to do |format|
      format.json { render json: link }
    end
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
