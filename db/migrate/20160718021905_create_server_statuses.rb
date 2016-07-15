class CreateServerStatuses < ActiveRecord::Migration
  def change
    create_table :server_statuses do |t|
      t.string  :name
      t.timestamps null: false
    end
  end
end
