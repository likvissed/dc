class ClustersController < ApplicationController
  load_and_authorize_resource

  before_action { |ctrl| ctrl.check_for_cancel clusters_path }
  before_action :find_cluster_by_name,  only: [:edit, :update]
  before_action :find_cluster_by_id,    only: [:show, :destroy]

  def index
    @clusters = Cluster.all
  end

  def show
  end

  def new
    respond_to do |format|
      format.html do
        @cluster = Cluster.new
        render :new
      end
      format.json do
        @servers = Server.all
        render json: @servers
      end
    end
  end

  def create
  end

  def edit
  end

  def update
  end

  def destroy
  end

  private

    # Разрешение изменения strong params
  def cluster_params
    params.require(:cluster).permit(:name)
  end

  # Поиск данных о типе запчасти по name
  def find_cluster_by_name
    @server = Cluster.find_by(name: params[:name])
  end

  # Поиск данных о типе запчасти по id
  def find_cluster_by_id
    @server = Cluster.find(params[:id])
  end

end
