class CreateServiceHostings < ActiveRecord::Migration
  def change
    create_table :service_hostings do |t|
      t.references :service, index: true
      t.references :cluster, index: true
      t.timestamps null: false
    end
  end
end
